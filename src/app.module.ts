import { Module } from '@nestjs/common';
import { ResendModule } from 'nestjs-resend';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ReportModule } from './modules/report/report.module';
import { DatabaseModule } from './modules/database/database.module';
import { ReportGenerationModule } from './modules/report-generation/report-generation.module';
import { JwtAccessAuthGuard } from './guards/jwt-access-auth.guard';

@Module({
  imports: [
    AuthModule, 
    ReportModule, 
    DatabaseModule, 
    ReportGenerationModule,
    ResendModule.forRoot({
      apiKey:process.env.MAIL_API_KEY || '',
    })
  ],
  controllers: [AppController],
  providers: [{
    provide: 'APP_GUARD',
    useClass: JwtAccessAuthGuard
  }],
})
export class AppModule {}
