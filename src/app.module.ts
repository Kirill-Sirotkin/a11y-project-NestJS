import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthLoginService } from './guards/auth-login/auth-login.service';
import { AuthJwtService } from './guards/auth-jwt/auth-jwt.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './services/database/database.service';
import { ReportModule } from './modules/report/report.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthAlphaModule } from './modules/auth-alpha/auth-alpha.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ReportGenerationService } from './services/report-generation/report-generation.service';
import { BullModule } from '@nestjs/bullmq';
import { ReportWorker } from './workers/report.worker';
import { FeedbackModule } from './modules/feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot(), ReportModule, AuthAlphaModule, 
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '14d' },
    }),
    ServeStaticModule.forRoot({
      // rootPath: join(__dirname, '..', 'reports'),
      rootPath: join(__dirname, 'reports'),
      serveRoot: '/reports',
      serveStaticOptions: {
        setHeaders: (res, path, stat) => {
          res.setHeader('Content-Type', 'application/pdf')
        }
      }
    }),
    FeedbackModule,
    // BullModule.forRoot({
    //   connection: {
    //     host: 'localhost',
    //     port: 6379,
    //   },
    //   defaultJobOptions: {
    //     attempts: 3,
    //     delay: 1000,
    //     removeOnComplete: 100,
    //     removeOnFail: 100,
    //   }
    // }),
  ],
  controllers: [AppController],
  providers: [AppService, AuthLoginService, AuthJwtService, DatabaseService, ReportGenerationService, ReportWorker],
})
export class AppModule {}
