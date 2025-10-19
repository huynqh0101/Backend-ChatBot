import { BadRequestException, Injectable, InternalServerErrorException, Logger  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { TokenType } from '@prisma/client';
import ms from 'ms'; 
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';


@Injectable()
export class AuthService {

  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService

  ) { }


  async registerUser(dto: RegisterUserDto): Promise<any> {
    this.logger.log(`POST: user/register: Register user started`);
    // Check if password and passwordConfirmation match
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    //Data to lower case
    dto.email = dto.email.toLowerCase().trim();
    // dto.name = dto.name.toLowerCase();


    //Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      
      const {passwordconf , ...newUserData} = dto
      newUserData.password = hashedPassword;

      const newuser = await this.prisma.user.create({
        data: newUserData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        }
      });

      const refreshToken = await this.generateAndStoreRefreshToken(newuser.id);

      return {
        user: newuser,
        token: this.getJwtToken({ id: newuser.id }),
        refreshToken,
      };
      
    } catch (error) {
      if (error.code === 'P2002') {
        this.logger.warn(`POST: auth/register: User already exists: ${dto.email}`);
        throw new BadRequestException('User already exists');
      }
      this.logger.error(`POST: auth/register: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }

  }


  async loginUser(email: string, password: string): Promise<any> {
    this.logger.log(`POST: auth/login: Login iniciado: ${email}`);
    let user;
    try {
      user = await this.prisma.user.findUniqueOrThrow({
        where: {
          email
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          image: true,
          role: true,
          createdAt: true,
        }
      });

    } catch (error) {
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new BadRequestException('Wrong credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new BadRequestException('Wrong credentials');
    }
    
    delete user.password;
    
    this.logger.log(`POST: auth/login: Usuario aceptado: ${user.email}`);
    const refreshToken = await this.generateAndStoreRefreshToken(user.id);

    return {
      user,
      token: this.getJwtToken({ id: user.id }),
      refreshToken,
    };
  }


  async refreshToken(user: User){
    return {
      user: user,
      token: this.getJwtToken({id: user.id})
    };


  }


  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;

  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.token.deleteMany({
      where: {
        userId,
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
      },
    });
  }

  async refreshTokenByToken(refreshToken: string) {
    const tokenRecord = await this.prisma.token.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.type !== TokenType.REFRESH_TOKEN ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired refresh token');
    }

    await this.prisma.token.deleteMany({
      where: { 
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN 
      },
    });

    const newRefreshToken = await this.generateAndStoreRefreshToken(tokenRecord.userId);

    return {
      user: tokenRecord.user,
      token: this.getJwtToken({ id: tokenRecord.user.id }),
      refreshToken: newRefreshToken,
    };
  }

  private async generateAndStoreRefreshToken(userId: string): Promise<string> {
    const refreshToken = nanoid(); 
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    const expiresAt = new Date(Date.now() + ms(expiresIn));

    await this.prisma.token.create({
      data: {
        userId,
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
        expiresAt,
      },
    });

    return refreshToken;
  }


}





