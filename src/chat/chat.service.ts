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
// import { HttpService } from '@nestjs/axios'; // Sẽ dùng khi kết nối AI Service
// import { ConfigService } from '@nestjs/config'; // Sẽ dùng khi kết nối AI Service

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');

  constructor(
    private prisma: PrismaService,
    // private readonly httpService: HttpService, // Sẽ dùng khi kết nối AI Service
    // private configService: ConfigService, // Sẽ dùng khi kết nối AI Service
  ) {}

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

    // --- Tạm thời trả về tin nhắn giả lập của AI ---
    // TODO: Thay thế phần này bằng logic gọi AI Service (Backend #2)
    // const aiResponse = await this.callAIService(content);
    const mockAiResponse = {
      answer: `Đây là câu trả lời giả lập cho câu hỏi: "${content}"`,
      sources: [{ document: 'mock.pdf', content: 'Đây là nội dung trích dẫn.' }],
    };
    // ----------------------------------------------------

    const aiMessage = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: mockAiResponse.answer,
        metadata: mockAiResponse.sources as any,
      },
    });

    // Cập nhật thời gian cho cuộc trò chuyện
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return aiMessage;
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

    await this.prisma.conversation.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'All conversations deleted successfully' };
  }
}