import { Module } from '@nestjs/common';
import { ResendModule } from 'nestjs-resend';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ReportModule } from './modules/report/report.module';
import { DatabaseModule } from './modules/database/database.module';
import { ReportGenerationModule } from './modules/report-generation/report-generation.module';
import { JwtAccessAuthGuard } from './guards/jwt-access-auth.guard';
import { TokenGenerationService } from './modules/token-generation/token-generation.service';
import { TokenGenerationModule } from './modules/token-generation/token-generation.module';
import { JwtModule } from '@nestjs/jwt';
import { StrategiesVerificationModule } from './modules/strategies-verification/strategies-verification.module';

@Module({
  imports: [
    AuthModule, 
    ReportModule, 
    DatabaseModule, 
    ReportGenerationModule,
    TokenGenerationModule,
    StrategiesVerificationModule,
    ResendModule.forRoot({
      apiKey:process.env.MAIL_API_KEY || '',
    }), 
    JwtModule.register({
      global: true,
    }), 
  ],
  controllers: [AppController],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAccessAuthGuard
    }
  ],
})
export class AppModule {}
