import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';
import { AuthAlphaDto } from './dto/auth-alpha.dto';
import { User } from '@prisma/client';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthAlphaService {
  constructor(
      private readonly databaseService: DatabaseService,
      private readonly jwtService: JwtService,
  ){}

  private readonly logger = new Logger(AuthAlphaService.name);

  async register(data: AuthAlphaDto) {
    this.logger.warn(`Attempting to register user with email: ${data.email}`);
    const key = await this.databaseService.getAlphaKey(data.alphaKey);
    if (!key) {
      this.logger.error(`Failed to register user with email: ${data.email}, alpha key \"${data.alphaKey}\" not found`);
      throw new NotFoundException("[ERROR] alpha key not found");
    }
    if (key.userId !== null) {
      this.logger.error(`Failed to register user with email: ${data.email}, alpha key \"${data.alphaKey}\" already used`);
      throw new NotFoundException("[ERROR] alpha key already used");
    }
    const user = await this.databaseService.postUser(data);
    await this.databaseService.patchAlphaKeyUser(data.alphaKey, user.id);

    const tokenString = await this.generateToken(user)
    const tokenJson = {token: tokenString}
    this.logger.log(`Success to register user with email: ${data.email}`);
    return tokenJson;
  }
  
  private async generateToken(user: User): Promise<string> {
      const payload = {
          id: user.id,
          email: user.email,
          name: user.name,
          organization: user.organization,
          isVerified: user.isVerified,
          role: user.role,
          subscription: user.subscription,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
      };
      const opts: JwtSignOptions = { secret: process.env.JWT_SECRET, expiresIn: '14d' };
      return this.jwtService.signAsync(payload, opts);
  }
}
