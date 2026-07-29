import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const context = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  context.enableShutdownHooks();
  Logger.log('BullMQ worker started', 'WorkerBootstrap');
}

void bootstrap();
