import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Nội dung của tin nhắn',
    example: 'Bạn có thể giải thích về mô hình RAG được không?',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống.' })
  @MaxLength(4000)
  content: string;

  @ApiProperty({
    description: 'ID của cuộc trò chuyện đã tồn tại (nếu có)',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsUUID('4', { message: 'ID cuộc trò chuyện không hợp lệ.' })
  @IsOptional()
  conversationId?: string;
}