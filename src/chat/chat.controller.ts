import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@ApiBearerAuth()
@ApiTags('Chat')
@Controller('chat')
@Auth() // Áp dụng Auth Guard cho tất cả các route trong controller này
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Gửi một tin nhắn mới' })
  @ApiResponse({ status: 201, description: 'Tin nhắn AI trả về.', type: Message })
  createMessage(
    @GetUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.chatService.createMessage(user, createMessageDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Conversation] })
  getConversations(@GetUser() user: User) {
    return this.chatService.getConversations(user);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Lấy tin nhắn của một cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Message] })
  getMessagesByConversation(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getMessagesByConversation(user, id);
  }
}