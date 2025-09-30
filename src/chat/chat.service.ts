import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');
  private readonly aiServiceUrl: string;

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService, // Inject HttpService
    private configService: ConfigService, // Inject ConfigService
  ) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL');
    if (!this.aiServiceUrl) {
      this.logger.error('AI_SERVICE_URL is not defined in .env file');
    }
  }

  async getConversations(user: User) {
    this.logger.log(`Fetching conversations for user: ${user.email}`);
    return this.prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getMessagesByConversation(user: User, conversationId: string) {
    this.logger.log(`Fetching messages for conversation ${conversationId}`);
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createMessage(user: User, createMessageDto: CreateMessageDto) {
    const { content, conversationId } = createMessageDto;
    let conversation: Conversation;

    if (conversationId) {
      conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });
      if (!conversation) {
        throw new ForbiddenException(
          'Không tìm thấy hoặc không có quyền truy cập cuộc trò chuyện này.',
        );
      }
    } else {
      conversation = await this.prisma.conversation.create({
        data: {
          userId: user.id,
          title: content.substring(0, 100),
        },
      });
    }

    // Lưu tin nhắn của người dùng
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content,
      },
    });

    // --- Gọi API đến Backend AI ---
    let aiResponse;
    try {
      this.logger.log(`Sending request to AI Service: ${this.aiServiceUrl}`);
      const response = await firstValueFrom(
        this.httpService.post(this.aiServiceUrl, {
          question: content,
        }),
      );
      aiResponse = response.data;
    } catch (error) {
      this.logger.error(`Error calling AI service: ${error.message}`, error.stack);
      throw new ServiceUnavailableException('Dịch vụ AI hiện không khả dụng.');
    }
    // -----------------------------

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.answer,
        metadata: aiResponse.sources as any,
      },
    });

    // Cập nhật thời gian cho cuộc trò chuyện
    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Lấy tất cả tin nhắn để trả về cho client
    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      conversation: updatedConversation,
      messages,
    };
  }

  async deleteConversation(user: User, conversationId: string) {
    this.logger.log(`Deleting conversation ${conversationId} for user: ${user.email}`);

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // onDelete: Cascade trong schema sẽ tự động xóa các message liên quan
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { message: 'Conversation deleted successfully' };
  }

  async deleteMessage(user: User, messageId: string) {
    this.logger.log(`Deleting message ${messageId} for user: ${user.email}`);

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          userId: user.id,
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Message deleted successfully' };
  }

  async deleteAllConversations(user: User) {
    this.logger.log(`Deleting all conversations for user: ${user.email}`);

    const result = await this.prisma.conversation.deleteMany({
      where: { userId: user.id },
    });

    return { message: `Deleted ${result.count} conversations successfully` };
  }
}