import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

    async generateReport(userId: string, domain: string) {
        const report = await this.databaseService.postReport({ userId, domain });
        const user = await this.databaseService.getUserById(userId);
        if (user === null) throw new NotFoundException("[ERROR] user not found");
        // if (user.remainingReports <= 0) throw new InternalServerErrorException("[ERROR] user has no remaining reports");
        
        const opts = new chrome.Options();
        opts.addArguments('--headless')
        const driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(opts)
            .build();
        await driver.get(domain);

        const fileNameRaw = "reports/report_" + Date.now()
        const fileName = fileNameRaw + ".json"
        const fileNamePdf = fileNameRaw + ".pdf"
        let reportResults: AxeResults
        try {
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
        } catch (error) {
            await driver.quit();
            throw new InternalServerErrorException("[ERROR] failed to generate report: " + error);
        }
        await driver.quit();
        
        await this.databaseService.patchUser(userId, { remainingReports: user.remainingReports - 1 });

        // return database entry on report
        return await this.databaseService.patchReport(report.id, { fileName: fileNamePdf, status: ReportStatus.COMPLETED });

        // return raw report data
        // await this.databaseService.patchReport(report.id, { fileName, status: ReportStatus.COMPLETED });
        // return reportResults.violations
    }

    async getUserReports(userId: string) {
        return this.databaseService.getUserReports(userId)
    }
}
