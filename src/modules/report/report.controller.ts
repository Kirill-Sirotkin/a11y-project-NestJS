import { Request, Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { User } from '@prisma/client';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @Get('users')
  async login(@Request() req): Promise<User[]> {
    return await this.reportService.getAllUsers()
  }
}
