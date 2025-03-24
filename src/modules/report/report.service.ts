import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { DatabaseService } from 'src/services/database/database.service';
import { AxeBuilder } from '@axe-core/webdriverjs';
import { Builder } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import { AxeResults } from 'axe-core';
import jsPDF from 'jspdf';

@Injectable()
export class ReportService {
    constructor(private readonly databaseService: DatabaseService) {}
            
    private readonly logger = new Logger(ReportService.name);

    async generateReport(userId: string, domain: string) {
        const report = await this.databaseService.postReport({ userId, domain });
        const user = await this.databaseService.getUserById(userId);
        if (user === null) throw new NotFoundException("[ERROR] user not found");
        // if (user.remainingReports <= 0) throw new InternalServerErrorException("[ERROR] user has no remaining reports");
        this.logger.warn(`Attempting to generate report for user: ${user.email}, for domain \"${domain}\"`);
        
        const opts = new chrome.Options();
        opts.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage', '--incognito', '--disable-gpu', '--enable-unsafe-swiftshader');
        const driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(opts)
            .build();

        const fileNameRaw = "reports/report_" + Date.now()
        const fileName = fileNameRaw + ".json"
        const fileNamePdf = fileNameRaw + ".pdf"
        try {
            await driver.get(domain);
            let reportResults: AxeResults

            const results = await new AxeBuilder(driver).analyze();
            // saving json report as file, not needed right now
            // fs.writeFileSync(fileName, JSON.stringify(results, null, 2), "utf8");

            const doc = new jsPDF();

            doc.text("Report!", 10, 10);
            doc.text("Total violations: " + results.violations.length.toString(), 10, 20)
            results.violations.forEach((violation, i) => {
                doc.text(violation.id, 10, 30 + i * 10)
            })
            doc.save(fileNamePdf);

            reportResults = results
            await driver.quit();
        
            await this.databaseService.patchUser(userId, { remainingReports: user.remainingReports - 1 });
            // return database entry on report
            this.logger.log(`Success to generate report for user: ${user.email}, for domain \"${domain}\"`);
            return await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.COMPLETED });
        } catch (error) {
            this.logger.error(`Failed to generate report for user: ${user.email}, for domain \"${domain}\", error: ${error}`);
            await driver.quit();
            await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.FAILED });
            throw new InternalServerErrorException("[ERROR] failed to generate report. Please make sure the URL is correct and contains \"https://\": " + error);
        }

        // return raw report data
        // await this.databaseService.patchReport(report.id, { fileName, status: ReportStatus.COMPLETED });
        // return reportResults.violations
    }

    async getUserReports(userId: string) {
        this.logger.log(`Fetching reports`);
        return this.databaseService.getUserReports(userId)
    }
}
