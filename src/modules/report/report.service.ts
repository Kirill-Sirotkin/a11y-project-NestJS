import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report, User } from '@prisma/client';
import { NewReportDto } from './dto/new-report.dto';

@Injectable()
export class ReportService {
    constructor(private readonly databaseService: DatabaseService) {}
    
    // async getAllUsers(): Promise<User[]> {
    //     return this.databaseService.getUsers()
    // }

    async generateReport(userId: string, data: NewReportDto): Promise<Report> {
        const report = await this.databaseService.createReport(userId, data.domain);
        // try/catch starting a job. If fails, change report status to failed
        return report;
    }

    async getUserReports(userId: string): Promise<Report[]> {
        const user = await this.databaseService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        return this.databaseService.getUserReportsByUserId(userId)
    }

    async getUserReportById(userId: string, reportId: string): Promise<Report> {
        const user = await this.databaseService.getReportUserById(reportId);
        if (!user) {
            throw new NotFoundException('user not found');
        }

        if (user.id !== userId) {
            throw new ForbiddenException('user does not have permission to access this report');
        }

        return this.databaseService.getReportById(reportId)
    }
}