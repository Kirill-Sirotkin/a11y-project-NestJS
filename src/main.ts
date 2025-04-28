import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'fatal'] });
  app.enableCors({ origin: ['http://localhost:3000', 'https://a11y-project-steel.vercel.app'] });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
