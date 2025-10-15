import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/user/entities/user.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.guard';

@ApiBearerAuth()
@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @UseGuards(OptionalJwtAuthGuard) 
  @ApiOperation({ summary: 'Gửi một tin nhắn mới' })
  @ApiResponse({ status: 201, description: 'Tin nhắn AI trả về.', type: Message })
  createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @GetUser({ required: false }) user?: User,
  ) {
    console.log('=== CONTROLLER DEBUG ===');
    console.log('User from decorator:', user ? `${user.email} (ID: ${user.id})` : 'null');
    
    return this.chatService.createMessage(user || null, createMessageDto);
  }

  @Get('conversations')
  @Auth()
  @ApiOperation({ summary: 'Lấy danh sách các cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Conversation] })
  getConversations(@GetUser() user: User) {
    return this.chatService.getConversations(user);
  }

  @Get('conversations/:id')
  @Auth()
  @ApiOperation({ summary: 'Lấy tin nhắn của một cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Message] })
  getMessagesByConversation(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getMessagesByConversation(user, id);
  }

  @Delete('conversations/:id')
  @Auth()
  @ApiOperation({ summary: 'Xóa một cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  deleteConversation(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.deleteConversation(user, id);
  }

  @Delete('messages/:id')
  @Auth()
  @ApiOperation({ summary: 'Xóa một tin nhắn' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  deleteMessage(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.deleteMessage(user, id);
  }

  @Delete('conversations')
  @Auth()
  @ApiOperation({ summary: 'Xóa tất cả cuộc trò chuyện của user' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  deleteAllConversations(@GetUser() user: User) {
    return this.chatService.deleteAllConversations(user);
  }
}