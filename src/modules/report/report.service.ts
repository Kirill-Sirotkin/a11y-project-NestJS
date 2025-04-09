import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { Report, ReportStatus, User } from '@prisma/client';
import { DatabaseService } from 'src/services/database/database.service';
import { AxeBuilder } from '@axe-core/webdriverjs';
import { Builder, ThenableWebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { AxeResults } from 'axe-core';
import jsPDF from 'jspdf';
import { ReportGenerationService } from 'src/services/report-generation/report-generation.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReportService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly reportGenerationService: ReportGenerationService,
        // @InjectQueue('reportQueue') private readonly reportQueue: Queue,
    ) {}

    private jobsCounter = 0;
    private readonly MAX_CONCURRENT_JOBS = 5;
    private readonly logger = new Logger(ReportService.name);

    async generateReport(userId: string, domain: string) {
        if (this.jobsCounter >= this.MAX_CONCURRENT_JOBS) {
            this.logger.warn(`Max concurrent jobs reached. Cannot analyze \"${domain}\"`);
            throw new InternalServerErrorException("[ERROR] server processing is at maximum capacity. Please try again later.");
        }
        this.jobsCounter++;

        const report = await this.databaseService.postReport({ userId, domain });
        const user = await this.databaseService.getUserById(userId);
        if (user === null) {
            this.jobsCounter--;
            throw new NotFoundException("[ERROR] user not found");
        }
        // if (user.remainingReports <= 0) throw new InternalServerErrorException("[ERROR] user has no remaining reports");
        this.logger.warn(`Attempting to generate report for user: ${user.email}, for domain \"${domain}\". Current running jobs: ${this.jobsCounter}`);

        const fileNameRaw = "reports/report_" + Date.now()
        const fileName = fileNameRaw + ".json"
        const fileNamePdf = fileNameRaw + ".pdf"

        // const userDataDir = `tempdir_${Date.now()}`
        // const userDataDirPath = `/${process.env.USER_DATA_DIR}/${userDataDir}`
        // //fs.mkdirSync(userDataDirPath, { recursive: true });

        // let driver: ThenableWebDriver;
        // try {
        //     const opts = new chrome.Options();
        //     this.logger.warn(`User data dir for this user: ${`--user-data-dir=${userDataDirPath}`}`)
        //     opts.addArguments(
        //         `--user-data-dir=${userDataDirPath}`, 
        //         '--headless=new', 
        //         '--no-sandbox', 
        //         '--disable-dev-shm-usage', 
        //         '--incognito', 
        //         '--disable-gpu',
        //         'enable-automation',
        //         '--dns-prefetch-disable',
        //         '--disable-extensions',  
        //     );
        //     driver = new Builder()
        //         .forBrowser('chrome')
        //         .setChromeOptions(opts)
        //         .build();
        //     driver.manage().setTimeouts({ implicit: 300000, pageLoad: 300000, script: 600000 });
        // } catch (error) {
        //     this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}`);
        //     await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.FAILED });
        //     this.jobsCounter--;
        //     throw new InternalServerErrorException("[ERROR] failed to generate report. Algorithm could not be started. " + error);
       
        // }

        // try {        
        //     await driver.get(domain);
        //     let reportResults: AxeResults

        //     const results = await new AxeBuilder(driver).analyze();

        //     const doc = this.reportGenerationService.generateReport(results)
        //     doc.save(fileNamePdf);
                
        //     reportResults = results
        //     await driver.quit();
        
        //     await this.databaseService.patchUser(userId, { remainingReports: user.remainingReports - 1 });
        //     this.logger.log(`Success to generate report for user: ${user.email}, for domain \"${domain}\"`);
        //     this.jobsCounter--;
        //     return await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.COMPLETED });
        // } catch (error) {
        //     this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}`);
        //     await driver.quit();
        //     await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.FAILED });
        //     this.jobsCounter--;
        //     throw new InternalServerErrorException("[ERROR] failed to generate report. Please make sure the URL is correct and contains \"https://\": " + error);
        // }

        let tries: number = 0;
        const MAX_TRIES: number = 3;
        let success: boolean = false;
        while (!success && tries < MAX_TRIES) {
            try {
                await this.analyzePage(domain, fileNamePdf, userId, user, report);
                success = true;
                this.jobsCounter--;
                // await driver.quit();
                return await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.COMPLETED });
            } catch (error) {
                tries++;
                this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}\nRetrying... Retry number: ${tries}`);
                if (tries >= MAX_TRIES) {
                    // await driver.quit();
                    await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.FAILED });
                    this.jobsCounter--;
                    throw new InternalServerErrorException("[ERROR] failed to generate report. Please make sure the URL is correct and contains \"https://\": " + error);
                }
            }
        }
    }

    async getUserReports(userId: string) {
        this.logger.log(`Fetching reports`);
        return this.databaseService.getUserReports(userId)
    }

    private async analyzePage(domain: string, fileNamePdf: string, userId: string, user: User, report: Report) {

        const userDataDir = `tempdir_${Date.now()}`
        const userDataDirPath = `/${process.env.USER_DATA_DIR}/${userDataDir}`
        //fs.mkdirSync(userDataDirPath, { recursive: true });

        let driver: ThenableWebDriver;
        try {
            const opts = new chrome.Options();
            this.logger.warn(`User data dir for this user: ${`--user-data-dir=${userDataDirPath}`}`)
            opts.addArguments(
                `--user-data-dir=${userDataDirPath}`, 
                '--headless=new', 
                '--no-sandbox', 
                '--disable-dev-shm-usage', 
                '--incognito', 
                '--disable-gpu',
            );
            driver = new Builder()
                .forBrowser('chrome')
                .setChromeOptions(opts)
                .build();
            driver.manage().setTimeouts({ implicit: 300000, pageLoad: 300000, script: 600000 });
        } catch (error) {
            this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}`);
            await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.FAILED });
            throw new InternalServerErrorException("[ERROR] failed to generate report. Algorithm could not be started. " + error);
       
        }
        
        
        try {        
            await driver.get(domain);
            let reportResults: AxeResults

            const results = await new AxeBuilder(driver).analyze();

            const doc = this.reportGenerationService.generateReport(results)
            doc.save(fileNamePdf);
            // console.log("add to queue")
            // this.reportQueue.add('report-job', { results })
                
            reportResults = results
            await driver.quit();
        
            await this.databaseService.patchUser(userId, { remainingReports: user.remainingReports - 1 });
            this.logger.log(`Success to generate report for user: ${user.email}, for domain \"${domain}\"`);
        } catch (error) {
            this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}`);
            await driver.quit();
            throw new InternalServerErrorException("[ERROR] failed to generate report. Please make sure the URL is correct and contains \"https://\": " + error);
        }
    }
}
