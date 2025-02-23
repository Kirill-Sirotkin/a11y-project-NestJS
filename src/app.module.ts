import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthLoginService } from './guards/auth-login/auth-login.service';
import { AuthJwtService } from './guards/auth-jwt/auth-jwt.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './services/database/database.service';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, ReportModule],
  controllers: [AppController],
  providers: [AppService, AuthLoginService, AuthJwtService, DatabaseService],
})
export class AppModule {}
