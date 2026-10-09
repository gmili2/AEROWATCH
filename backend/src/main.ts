import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOADS_URL, UploadsService } from './common/uploads.service';
import { AllExceptionsFilter, requestId } from './common/http';
import { validateEnv } from './config';

async function bootstrap() {
  const env = validateEnv(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.useBodyParser('json', { limit: '100kb' });
  app.use(requestId, helmet(), cookieParser());
  app.enableCors({ origin: env.FRONTEND_URL, credentials: true });
  // Images envoyées depuis l'admin (noms aléatoires, jamais réécrits : cache long).
  app.useStaticAssets(app.get(UploadsService).root, { prefix: UPLOADS_URL + '/', maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen(env.PORT);
  Logger.log(`API prête sur http://localhost:${env.PORT}/api/v1`, 'Bootstrap');
}
bootstrap();
