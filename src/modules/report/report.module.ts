import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { DatabaseService } from 'src/services/database/database.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, DatabaseService],
})
export class ReportModule {}
