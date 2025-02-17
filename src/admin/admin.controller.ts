import { Controller, Get, Param } from '@nestjs/common';
import { User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly databaseService: DatabaseService) {}

    @Get('users')
    async getUsers() {
        return await this.databaseService.getUsers();
    }

    @Get('reports')
    async getReports() {
        return await this.databaseService.getReports();
    }

    @Get('users/:id')
    async getUserById(@Param('id') id: string) {
        return await this.databaseService.getUserById(id);
    }

    @Get('reports/:id')
    async getReportById(@Param('id') id: string) {
        return await this.databaseService.getReportById(id);
    }
}
