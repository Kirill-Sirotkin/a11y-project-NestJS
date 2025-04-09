import { Body, Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthJwtService } from 'src/guards/auth-jwt/auth-jwt.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(AuthJwtService)
  async postFeedbackMessage(@Body() data: { text: string }, @Request() request) {
    await this.feedbackService.postFeedbackMessage(request.user.id, data.text);
    return { message: "Feedback message submitted succesfully"}
  }

  @Get()
  async getFeedbackMessages(@Body() data: { adminSecret: string }) {
    if (data.adminSecret !== process.env.ADMIN_SECRET) {
      return { message: "Invalid admin secret" };
    }
    return await this.feedbackService.getFeedbackMessages()
  }
}
