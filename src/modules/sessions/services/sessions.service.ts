import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReschedulingMode } from '@/generated/prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { SchedulingService } from '@/modules/scheduling/services/scheduling.service';
import { canTransition, transitionError } from '../domain/session-state.machine';
import type { CompleteSessionDto } from '../dto/complete-session.dto';
import type { SkipSessionDto } from '../dto/skip-session.dto';
import type { TaskFeedbackDto } from '../dto/task-feedback.dto';
import { SessionsRepository } from '../repositories/sessions.repository';

@Injectable()
export class SessionsService {
  constructor(
    private readonly repository: SessionsRepository,
    private readonly scheduling: SchedulingService,
    private readonly audit: AuditService,
  ) {}

  async start(userId: string, id: string) {
    const session = await this.session(userId, id);
    this.assertTransition(session.status, 'START');
    const result = await this.repository.start(userId, session, new Date());
    this.auditAction(userId, 'STUDY_SESSION_STARTED', id);
    return result;
  }

  async pause(userId: string, id: string) {
    const session = await this.session(userId, id);
    this.assertTransition(session.status, 'PAUSE');
    const result = await this.repository.pause(userId, session, new Date());
    this.auditAction(userId, 'STUDY_SESSION_PAUSED', id);
    return result;
  }

  async complete(userId: string, id: string, dto: CompleteSessionDto) {
    const session = await this.session(userId, id);
    this.assertTransition(session.status, 'COMPLETE');
    const result = await this.repository.complete(userId, session, dto, new Date());
    this.auditAction(userId, 'STUDY_SESSION_COMPLETED', id);
    return result;
  }

  async skip(userId: string, id: string, dto: SkipSessionDto) {
    const session = await this.session(userId, id);
    this.assertTransition(session.status, 'SKIP');
    const result = await this.repository.skip(userId, session, dto.reason, new Date());
    const roadmapId = session.task.module.milestone.version.roadmap.id;
    const rescheduleJob = await this.scheduling.rebalance(userId, {
      roadmapId,
      mode: dto.reschedulingMode ?? ReschedulingMode.BALANCED,
    });
    this.auditAction(userId, 'STUDY_SESSION_SKIPPED', id);
    return { session: result, rescheduleJob };
  }

  async completeTask(userId: string, id: string) {
    const task = await this.repository.findOwnedTask(userId, id);
    if (!task) throw new NotFoundException('Learning task not found.');
    const result = await this.repository.completeTask(userId, id, new Date());
    this.auditAction(userId, 'LEARNING_TASK_COMPLETED', id, 'LearningTask');
    return result;
  }

  async feedback(userId: string, id: string, dto: TaskFeedbackDto) {
    const task = await this.repository.findOwnedTask(userId, id);
    if (!task) throw new NotFoundException('Learning task not found.');
    if (Object.values(dto).every((value) => value === undefined))
      throw new BadRequestException('At least one feedback field must be supplied.');
    const result = await this.repository.createTaskFeedback(userId, id, dto);
    this.auditAction(userId, 'LEARNING_TASK_FEEDBACK_RECORDED', id, 'LearningTask');
    return result;
  }

  private async session(userId: string, id: string) {
    const session = await this.repository.findOwnedSession(userId, id);
    if (!session) throw new NotFoundException('Study session not found.');
    return session;
  }

  private assertTransition(
    status: Parameters<typeof canTransition>[0],
    action: Parameters<typeof canTransition>[1],
  ): void {
    if (!canTransition(status, action))
      throw new ConflictException(transitionError(status, action));
  }

  private auditAction(
    userId: string,
    action: string,
    entityId: string,
    entityType = 'StudySession',
  ): void {
    void this.audit.record({ userId, action, entityType, entityId });
  }
}
