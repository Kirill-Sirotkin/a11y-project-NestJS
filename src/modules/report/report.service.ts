import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Report, ReportStatus } from '@prisma/client';
import { DatabaseService } from 'src/services/database/database.service';
import { AxeBuilder } from '@axe-core/webdriverjs';
import { Builder } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as fs from 'fs';

@Injectable()
export class ReportService {
    constructor(private readonly databaseService: DatabaseService) {}

    async generateReport(userId: string, domain: string) {
        const report = await this.databaseService.postReport({ userId, domain });
        
        const opts = new chrome.Options();
        opts.addArguments('--headless')
        const driver = new Builder()
            .forBrowser('chrome')
            .setChromeOptions(opts)
            .build();
        await driver.get(domain);

        const fileName = "reports/report_" + Date.now() + ".json"
        try {
            const results = await new AxeBuilder(driver).analyze();
            fs.writeFileSync(fileName, JSON.stringify(results, null, 2), "utf8");
        } catch (error) {
            await driver.quit();
            throw new InternalServerErrorException("[ERROR] failed to generate report: " + error);
        }
        await driver.quit();
        
        return await this.databaseService.patchReport(report.id, { fileName, status: ReportStatus.COMPLETED });
    }
}
