import { Body, Controller, Header, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { AuthJwtService } from 'src/guards/auth-jwt/auth-jwt.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(AuthJwtService)
  async generateReport(@Body() data: { domain: string }, @Request() request) {
    return await this.reportService.generateReport(request.user.id, data.domain);
  }
}
