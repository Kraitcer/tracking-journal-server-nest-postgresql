import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
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
  const publicDir = path.resolve('public');
  const indexFile = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    app.useStaticAssets(publicDir);
    app.use((request: Request, response: Response, next: NextFunction) => {
      const isApiRequest =
        request.path === '/api' || request.path.startsWith('/api/');
      const isUploadRequest =
        request.path === '/uploads' || request.path.startsWith('/uploads/');

      if (
        request.method !== 'GET' ||
        isApiRequest ||
        isUploadRequest ||
        !request.accepts('html')
      ) {
        next();
        return;
      }

      response.sendFile(indexFile);
    });
  }

  await app.listen(appConfig.port);
}
await bootstrap();
