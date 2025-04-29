import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from 'src/strategies/local.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
