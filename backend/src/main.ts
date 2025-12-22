import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule /* {
    logger: false,
  } */,
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) =>
    o.trim(),
  ) ?? ['http://localhost:5173'];

  // Trust proxy for correct client IP in rate limiting
  app.set('trust proxy', 1);
  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
}
bootstrap();
