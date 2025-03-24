import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/services/database/database.service';

@Module({
  // imports: [
  //   JwtModule.register({
  //     global: false,
  //     secret: process.env.JWT_SECRET,
  //     signOptions: { expiresIn: '60s' },
  //   })
  // ],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService],
})
export class AuthModule {}
