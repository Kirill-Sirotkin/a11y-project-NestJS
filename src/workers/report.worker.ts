import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

@Processor("reportQueue")
export class ReportWorker extends WorkerHost {
    async process(job: Job): Promise<any> {
        console.log(`Processing report: ${job.id}`)
    }
}