import 'dotenv/config';
import fs from 'node:fs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { LegacyExceptionFilter } from './common/legacy-exception.filter.js';
import { appConfig, getJwtSecret } from './config.js';

async function bootstrap() {
  getJwtSecret();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: appConfig.corsOrigins });
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalFilters(new LegacyExceptionFilter());

  fs.mkdirSync(appConfig.uploadsDir, { recursive: true });
  // GET /uploads/<userId>/<filename>
  app.useStaticAssets(appConfig.uploadsDir, {
    prefix: '/uploads',
    setHeaders: (response) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
    },
  });

  await app.listen(appConfig.port);
}
await bootstrap();
