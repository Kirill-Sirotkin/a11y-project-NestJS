import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Report, ReportStatus, User } from '@prisma/client';
import { NewReportDto } from './dto/new-report.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { AccessibilityAnalysisDto } from './dto/accessibility-analysis.dto';
import { ReportGenerationDto } from './dto/report-generation.dto';
import { ACCESSIBILITY_ANALYSIS_QUEUE, QueueName, REPORT_GENERATION_QUEUE } from 'src/common/constants';

@Injectable()
export class ReportService {
    constructor(
        private readonly databaseService: DatabaseService,
        @InjectQueue(ACCESSIBILITY_ANALYSIS_QUEUE) private readonly accessibilityQueue: Queue,
        @InjectQueue(REPORT_GENERATION_QUEUE) private readonly reportQueue: Queue,
    ) {}
    
    // async getAllUsers(): Promise<User[]> {
    //     return this.databaseService.getUsers()
    // }

    async generateReport(userId: string, data: NewReportDto): Promise<Report> {
        const report = await this.databaseService.createReport(userId, data.domain);
        const user = await this.databaseService.getUserById(userId);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        // try/catch starting a job. If fails, change report status to failed
        // OR use a queue listener to change job to failed/completed
        const jobData: AccessibilityAnalysisDto = {
            domain: data.domain,
            userEmail: user.email,
            reportId: report.id,
        }
        this.accessibilityQueue.add('analyze-domain', jobData)

        return report
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

    async queueAddReportGenerationJob(data: ReportGenerationDto): Promise<void> {
        await this.reportQueue.add('generate-report', data);
    }

    async queueUpdateReportStatus(jobId: string, queueName: QueueName, status: ReportStatus): Promise<void> {
        let job: Job
        switch (queueName) {
            case QueueName.AccessibilityQueue:
                job = await this.accessibilityQueue.getJob(jobId);
                break;
            case QueueName.ReportQueue:
                job = await this.reportQueue.getJob(jobId);
                break;
            default:
                // log error
                return;
        }
        console.log(`job data queried from queue: ${JSON.stringify(job.data)}`);
        if (!job) {
            // log error
        }
        await this.databaseService.updateReportStatusById(job.data.reportId, status);
    }
}