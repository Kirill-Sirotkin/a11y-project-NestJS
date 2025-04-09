import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { DatabaseService } from 'src/services/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ReportGenerationService } from 'src/services/report-generation/report-generation.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // BullModule.registerQueue({
    //   name: 'reportQueue',
    // }),
  ],
  controllers: [ReportController],
  providers: [ReportService, DatabaseService, ReportGenerationService],
})
export class ReportModule {}
