import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/services/database/database.service';

@Injectable()
export class FeedbackService {
    constructor(
        private readonly databaseService: DatabaseService
    ) {}

    async postFeedbackMessage(userId: string, text: string) {
        return this.databaseService.postFeedbackMesage({ userId, text })
    }

    async getFeedbackMessages() {
        return this.databaseService.getFeedbackMessages()
    }
}
