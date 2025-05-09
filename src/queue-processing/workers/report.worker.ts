import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { REPORT_GENERATION_QUEUE } from "src/common/constants";
import { ReportGenerationDto } from "src/modules/report/dto/report-generation.dto";

@Processor(REPORT_GENERATION_QUEUE, { concurrency: 2 })
export class ReportWorker extends WorkerHost {
    async process(job: Job): Promise<ReportGenerationDto> {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return job.data;
    }
}