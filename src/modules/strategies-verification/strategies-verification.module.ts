import { Module } from '@nestjs/common';
import { StrategiesVerificationService } from './strategies-verification.service';

@Module({
  providers: [StrategiesVerificationService],
  exports: [StrategiesVerificationService],
})
export class StrategiesVerificationModule {}
