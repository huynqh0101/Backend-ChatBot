import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class Message {
  @ApiProperty({ example: 'f1e2d3c4-b5a6-9876-5432-10fedcba9876' })
  id: string;

  @ApiProperty({
    description: 'Vai trò của người gửi: "user" hoặc "assistant"',
    example: 'user',
  })
  role: string;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Bạn có thể giải thích về mô hình RAG được không?',
  })
  content: string;

  @ApiProperty({
    description: 'Metadata chứa thông tin nguồn từ RAG',
    example: { sources: [{ document: 'rag.pdf', page: 1 }] },
    required: false,
    nullable: true,
  })
  metadata: Prisma.JsonValue;

  @ApiProperty()
  createdAt: Date;
}