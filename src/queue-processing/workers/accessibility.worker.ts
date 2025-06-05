/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ACCESSIBILITY_ANALYSIS_QUEUE } from 'src/common/constants';
import { ReportGenerationDto } from 'src/modules/report/dto/report-generation.dto';

@Processor(ACCESSIBILITY_ANALYSIS_QUEUE, { concurrency: 2 })
export class AccessibilityWorker extends WorkerHost {
  async process(job: Job): Promise<ReportGenerationDto> {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const accessibilityAnalysisFilePath =
      'path/to/accessibility-analysis-file.json';
    return {
      userEmail: job.data.userEmail,
      accessibilityAnalysisFilePath,
      reportId: job.data.reportId,
    };
  }
}
