import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  //   const httpsOptions = {
  //   key: fs.readFileSync('/etc/letsencrypt/live/a11y-project.duckdns.org/privkey.pem'),
  //   cert: fs.readFileSync('/etc/letsencrypt/live/a11y-project.duckdns.org/fullchain.pem'),
  // };
  // const app = await NestFactory.create(AppModule, { httpsOptions, logger: ['error', 'warn', 'log', 'fatal'] });
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'fatal'] });
  app.enableCors({ origin: ['http://localhost:3000', 'https://a11y-project-steel.vercel.app'] });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
