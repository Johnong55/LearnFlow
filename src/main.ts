import 'reflect-metadata';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded, type Express } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const prefix = config.get<string>('app.apiPrefix', 'api/v1');
  app.use(helmet());
  const bodyLimit = config.get<string>('app.bodyLimit', '1mb');
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string[]>('app.corsOrigins', []),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  if (config.get<boolean>('app.trustProxy', false)) {
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    expressApp.set('trust proxy', 1);
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
    }),
  );
  app.setGlobalPrefix(prefix, {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/{*path}', method: RequestMethod.ALL },
    ],
  });
  app.enableShutdownHooks();

  if (config.get<boolean>('app.swaggerEnabled', true)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LearnFlow API')
      .setDescription('AI-powered personal learning roadmap and life scheduling API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('app.port', 3000);
  const host = config.get<string>('app.host', '0.0.0.0');
  await app.listen(port, host);
  Logger.log(`API listening on http://${host}:${port}`, 'Bootstrap');
}

void bootstrap();
