import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import type { CreateAvailabilityRuleDto } from '../dto/create-availability-rule.dto';
import type { UpdateAvailabilityRuleDto } from '../dto/update-availability-rule.dto';
import { AvailabilityRepository } from '../repositories/availability.repository';

interface AvailabilityCandidate {
  startTime: string;
  endTime: string;
  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly repository: AvailabilityRepository,
    private readonly audit: AuditService,
  ) {}
  list(userId: string) {
    return this.repository.list(userId);
  }

  async create(userId: string, dto: CreateAvailabilityRuleDto) {
    this.validate(dto);
    const result = await this.repository.create(
      userId,
      dto as Prisma.AvailabilityRuleCreateWithoutUserInput,
    );
    void this.audit.record({
      userId,
      action: 'AVAILABILITY_RULE_CREATED',
      entityType: 'AvailabilityRule',
      entityId: result.id,
    });
    return result;
  }

  async update(userId: string, id: string, dto: UpdateAvailabilityRuleDto) {
    const existing = await this.repository.findOwned(userId, id);
    if (!existing) throw new NotFoundException('Availability rule not found.');
    this.validate({ ...existing, ...dto });
    const result = await this.repository.update(
      userId,
      id,
      dto as Prisma.AvailabilityRuleUpdateInput,
    );
    void this.audit.record({
      userId,
      action: 'AVAILABILITY_RULE_UPDATED',
      entityType: 'AvailabilityRule',
      entityId: id,
    });
    return result;
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.repository.findOwned(userId, id);
    if (!existing) throw new NotFoundException('Availability rule not found.');
    await this.repository.softDelete(userId, id);
    void this.audit.record({
      userId,
      action: 'AVAILABILITY_RULE_DELETED',
      entityType: 'AvailabilityRule',
      entityId: id,
    });
    return { message: 'Availability rule deleted successfully.' };
  }

  private validate(rule: AvailabilityCandidate): void {
    if (rule.startTime === rule.endTime)
      throw new BadRequestException('Availability start and end times must differ.');
    if (rule.effectiveFrom && rule.effectiveUntil && rule.effectiveUntil < rule.effectiveFrom)
      throw new BadRequestException('Effective end date cannot be earlier than the start date.');
  }
}
