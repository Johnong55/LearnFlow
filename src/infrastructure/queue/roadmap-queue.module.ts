import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ROADMAP_QUEUE } from './roadmap-queue.constants';

@Global()
@Module({ imports: [BullModule.registerQueue({ name: ROADMAP_QUEUE })], exports: [BullModule] })
export class RoadmapQueueModule {}
