import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ReportModule } from './modules/report/report.module';
import { DatabaseModule } from './modules/database/database.module';
import { ReportGenerationModule } from './modules/report-generation/report-generation.module';

@Module({
  imports: [AuthModule, ReportModule, DatabaseModule, ReportGenerationModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
