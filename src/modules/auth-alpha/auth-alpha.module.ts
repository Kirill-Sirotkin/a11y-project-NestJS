import { Module } from '@nestjs/common';
import { AuthAlphaService } from './auth-alpha.service';
import { AuthAlphaController } from './auth-alpha.controller';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from 'src/services/database/database.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '14d' },
    })
  ],
  controllers: [AuthAlphaController],
  providers: [AuthAlphaService, AuthService, DatabaseService],
})
export class AuthAlphaModule {}
