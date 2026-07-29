import { ConflictException } from '@nestjs/common';
import { ConstraintPriority, DayOfWeek, RoutineType } from '@prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { RoutinesRepository } from '../repositories/routines.repository';
import { RoutinesService } from '../services/routines.service';

describe('RoutinesService', () => {
  it('rejects overlap with a fixed routine', async () => {
    const repository = {
      listFixed: jest.fn().mockResolvedValue([
        {
          title: 'Work',
          weekdays: [DayOfWeek.MONDAY],
          startTime: '09:00',
          endTime: '17:00',
          bufferBeforeMinutes: 0,
          bufferAfterMinutes: 0,
        },
      ]),
      create: jest.fn(),
    };
    const service = new RoutinesService(
      repository as unknown as RoutinesRepository,
      {} as AuditService,
    );
    await expect(
      service.create('user-1', {
        type: RoutineType.PERSONAL,
        title: 'Appointment',
        weekdays: [DayOfWeek.MONDAY],
        startTime: '16:00',
        endTime: '18:00',
        isFlexible: false,
        constraintPriority: ConstraintPriority.HARD,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
