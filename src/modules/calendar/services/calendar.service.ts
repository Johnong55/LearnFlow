import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { addLocalDays, localDateKey, zonedDateTimeToUtc } from '@/common/utils/timezone.utils';
import { AuditService } from '@/infrastructure/logging/audit.service';
import type { CalendarRangeQueryDto } from '../dto/calendar-range-query.dto';
import type { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import type { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { CalendarRepository } from '../repositories/calendar.repository';

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string, query: CalendarRangeQueryDto) {
    const from = query.from ? new Date(query.from) : new Date();
    const to = query.to ? new Date(query.to) : new Date(from.getTime() + 7 * 86_400_000);
    this.validateRange(from, to);
    const [events, sessions] = await this.repository.list(userId, from, to);
    return {
      from,
      to,
      items: [
        ...events.map((event) => ({ kind: 'CALENDAR_EVENT' as const, ...event })),
        ...sessions.map((session) => ({ kind: 'STUDY_SESSION' as const, ...session })),
      ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    };
  }

  async day(userId: string, date?: string) {
    const { from, to } = await this.localRange(userId, date, 1);
    return this.list(userId, { from: from.toISOString(), to: to.toISOString() });
  }

  async week(userId: string, date?: string) {
    const { from, to } = await this.localRange(userId, date, 7);
    return this.list(userId, { from: from.toISOString(), to: to.toISOString() });
  }

  async create(userId: string, dto: CreateCalendarEventDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.validateRange(startAt, endAt);
    if (dto.isFixed !== false) await this.assertNoFixedOverlap(userId, startAt, endAt);
    const data: Prisma.CalendarEventCreateWithoutUserInput = {
      ...dto,
      startAt,
      endAt,
      metadata: dto.metadata as Prisma.InputJsonObject | undefined,
    };
    const result = await this.repository.create(userId, data);
    void this.audit.record({
      userId,
      action: 'CALENDAR_EVENT_CREATED',
      entityType: 'CalendarEvent',
      entityId: result.id,
    });
    return result;
  }

  async update(userId: string, id: string, dto: UpdateCalendarEventDto) {
    const existing = await this.repository.findOwned(userId, id);
    if (!existing) throw new NotFoundException('Calendar event not found.');
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    this.validateRange(startAt, endAt);
    const isFixed = dto.isFixed ?? existing.isFixed;
    if (isFixed) await this.assertNoFixedOverlap(userId, startAt, endAt, id);
    const data: Prisma.CalendarEventUpdateInput = {
      ...dto,
      startAt,
      endAt,
      metadata: dto.metadata as Prisma.InputJsonObject | undefined,
    };
    const result = await this.repository.update(userId, id, data);
    void this.audit.record({
      userId,
      action: 'CALENDAR_EVENT_UPDATED',
      entityType: 'CalendarEvent',
      entityId: id,
    });
    return result;
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    if (!(await this.repository.findOwned(userId, id)))
      throw new NotFoundException('Calendar event not found.');
    await this.repository.softDelete(userId, id);
    void this.audit.record({
      userId,
      action: 'CALENDAR_EVENT_DELETED',
      entityType: 'CalendarEvent',
      entityId: id,
    });
    return { message: 'Calendar event deleted successfully.' };
  }

  private validateRange(startAt: Date, endAt: Date): void {
    if (
      !Number.isFinite(startAt.getTime()) ||
      !Number.isFinite(endAt.getTime()) ||
      startAt >= endAt
    )
      throw new BadRequestException('Event end time must be after its start time.');
    if (endAt.getTime() - startAt.getTime() > 366 * 86_400_000)
      throw new BadRequestException('Calendar range cannot exceed 366 days.');
  }

  private async assertNoFixedOverlap(
    userId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<void> {
    const overlap = await this.repository.findFixedOverlaps(userId, startAt, endAt, excludeId);
    if (overlap)
      throw new ConflictException(`Fixed event overlaps calendar event "${overlap.title}".`);
  }

  private async localRange(userId: string, date: string | undefined, days: number) {
    const profile = await this.repository.userTimeZone(userId);
    const timeZone = profile?.timezone ?? 'UTC';
    const dateKey = date ?? localDateKey(new Date(), timeZone);
    return {
      from: zonedDateTimeToUtc(dateKey, '00:00', timeZone),
      to: zonedDateTimeToUtc(addLocalDays(dateKey, days), '00:00', timeZone),
    };
  }
}
