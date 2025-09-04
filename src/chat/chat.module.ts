import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [AuthModule, PrismaModule], // Import AuthModule để sử dụng @Auth() decorator
})
export class ChatModule {}