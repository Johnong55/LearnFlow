import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConstraintPriority } from '@/generated/prisma/client';
import { recurringTimesOverlap } from '@/common/utils/time.utils';
import { AuditService } from '@/infrastructure/logging/audit.service';
import type { CreateRoutineDto } from '../dto/create-routine.dto';
import type { UpdateRoutineDto } from '../dto/update-routine.dto';
import { RoutinesRepository } from '../repositories/routines.repository';

interface RoutineCandidate {
  weekdays: CreateRoutineDto['weekdays'];
  startTime: string;
  endTime: string;
  isFlexible?: boolean;
  constraintPriority?: ConstraintPriority;
  minimumDurationMinutes?: number | null;
  preferredDurationMinutes?: number | null;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}

@Injectable()
export class RoutinesService {
  constructor(
    private readonly repository: RoutinesRepository,
    private readonly audit: AuditService,
  ) {}

  list(userId: string) {
    return this.repository.list(userId);
  }

  async create(userId: string, dto: CreateRoutineDto) {
    this.validate(dto);
    await this.assertNoFixedOverlap(userId, dto);
    const result = await this.repository.create(userId, dto);
    void this.audit.record({
      userId,
      action: 'ROUTINE_CREATED',
      entityType: 'Routine',
      entityId: result.id,
    });
    return result;
  }

  async update(userId: string, id: string, dto: UpdateRoutineDto) {
    const existing = await this.repository.findOwned(userId, id);
    if (!existing) throw new NotFoundException('Routine not found.');
    const merged = { ...existing, ...dto };
    this.validate(merged);
    await this.assertNoFixedOverlap(userId, merged, id);
    const result = await this.repository.update(userId, id, dto);
    void this.audit.record({
      userId,
      action: 'ROUTINE_UPDATED',
      entityType: 'Routine',
      entityId: id,
    });
    return result;
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.repository.findOwned(userId, id);
    if (!existing) throw new NotFoundException('Routine not found.');
    await this.repository.softDelete(userId, id);
    void this.audit.record({
      userId,
      action: 'ROUTINE_DELETED',
      entityType: 'Routine',
      entityId: id,
    });
    return { message: 'Routine deleted successfully.' };
  }

  private validate(routine: RoutineCandidate): void {
    if (routine.startTime === routine.endTime)
      throw new BadRequestException('Routine start and end times must differ.');
    if (
      routine.minimumDurationMinutes &&
      routine.preferredDurationMinutes &&
      routine.minimumDurationMinutes > routine.preferredDurationMinutes
    ) {
      throw new BadRequestException('Minimum duration cannot exceed preferred duration.');
    }
  }

  private async assertNoFixedOverlap(
    userId: string,
    routine: RoutineCandidate,
    excludeId?: string,
  ): Promise<void> {
    if (routine.isFlexible || routine.constraintPriority === ConstraintPriority.SOFT) return;
    const fixed = await this.repository.listFixed(userId, excludeId);
    const conflict = fixed.find((existing) => recurringTimesOverlap(routine, existing));
    if (conflict)
      throw new ConflictException(`Routine overlaps fixed routine "${conflict.title}".`);
  }
}
