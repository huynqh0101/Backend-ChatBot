import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios'; 
import { ConfigModule } from '@nestjs/config';
@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [AuthModule, PrismaModule, HttpModule, ConfigModule], 
})
export class ChatModule {}