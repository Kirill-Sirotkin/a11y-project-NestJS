import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';
import { AuthAlphaDto } from './dto/auth-alpha.dto';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthAlphaService {
  constructor(
      private readonly databaseService: DatabaseService,
      private readonly jwtService: JwtService,
  ){}

  async register(data: AuthAlphaDto) {
    const key = await this.databaseService.getAlphaKey(data.alphaKey);
    if (!key) {
      throw new NotFoundException("[ERROR] alpha key not found");
    }
    if (key.userId !== null) {
      throw new NotFoundException("[ERROR] alpha key already used");
    }
    const user = await this.databaseService.postUser(data);
    await this.databaseService.patchAlphaKeyUser(data.alphaKey, user.id);

    const tokenString = await this.generateToken(user)
    const tokenJson = {token: tokenString}
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
      return this.jwtService.signAsync(payload);
  }
}
