import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from 'src/strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from 'src/strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from 'src/strategies/jwt-refresh.strategy';
import { GoogleStrategy } from 'src/strategies/google.strategy';
import { JwtVerifyStrategy } from 'src/strategies/jwt-verify.strategy';

@Module({
  imports: [
    PassportModule, 
    JwtModule.register({})
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtAccessStrategy, 
    JwtRefreshStrategy, 
    JwtVerifyStrategy,
    GoogleStrategy
  ],
})
export class AuthModule {}
