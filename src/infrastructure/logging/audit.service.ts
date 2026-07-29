import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type AuditLog } from '@/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface AuditInput {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  requestId?: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<AuditLog | undefined> {
    try {
      return await this.prisma.auditLog.create({ data: input });
    } catch (error) {
      this.logger.error(
        'Failed to persist audit log',
        error instanceof Error ? error.stack : undefined,
      );
      return undefined;
    }
  }
}
