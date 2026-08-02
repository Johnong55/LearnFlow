import { Injectable } from '@nestjs/common';
import { AvailabilityType, ConstraintPriority, ReschedulingMode } from '@/generated/prisma/client';
import {
  addLocalDays,
  eachLocalDate,
  weekdayForDate,
  zonedDateTimeToUtc,
} from '@/common/utils/timezone.utils';
import type {
  ProposedSession,
  SchedulePlan,
  SchedulingInput,
  SchedulingTask,
  TimeSlot,
} from './scheduling.types';

const MINUTE_MS = 60_000;

interface MutableSlot extends TimeSlot {
  dateKey: string;
}

@Injectable()
export class SchedulingEngine {
  generate(input: SchedulingInput): SchedulePlan {
    const tasks = this.orderTasks(input.tasks);
    const dailyMinutes = { ...input.existingDailyMinutes };
    const freeSlots = this.buildFreeSlots(input);
    const sessions: ProposedSession[] = [];
    const unscheduledTasks: SchedulePlan['unscheduledTasks'] = [];
    const completionTimes = new Map<string, Date>();
    const unscheduledIds = new Set<string>();

    for (const task of tasks) {
      if (task.dependencyIds.some((id) => unscheduledIds.has(id))) {
        unscheduledIds.add(task.id);
        unscheduledTasks.push({
          taskId: task.id,
          taskTitle: task.title,
          remainingMinutes: task.estimatedMinutes,
          code: 'DEPENDENCY_UNSCHEDULED',
          reason: 'A prerequisite task could not be scheduled.',
        });
        continue;
      }
      const chunks = this.chunkTask(
        task.estimatedMinutes,
        input.preferredSessionMinutes,
        input.minimumSessionMinutes,
      );
      if (!chunks.length) {
        unscheduledIds.add(task.id);
        unscheduledTasks.push({
          taskId: task.id,
          taskTitle: task.title,
          remainingMinutes: task.estimatedMinutes,
          code: 'TASK_TOO_SHORT',
          reason: `Task is shorter than the minimum ${input.minimumSessionMinutes}-minute session.`,
        });
        continue;
      }

      let remaining = task.estimatedMinutes;
      let earliestStart = this.latestDependencyCompletion(task, completionTimes);
      let placedAll = true;
      for (const chunk of chunks) {
        const slotIndex = this.selectSlot(
          freeSlots,
          chunk,
          earliestStart,
          dailyMinutes,
          input.maxDailyLearningMinutes,
          task,
          input,
        );
        if (slotIndex < 0) {
          placedAll = false;
          break;
        }
        const slot = freeSlots[slotIndex]!;
        const endAt = new Date(slot.startAt.getTime() + chunk * MINUTE_MS);
        sessions.push({
          taskId: task.id,
          taskTitle: task.title,
          startAt: slot.startAt,
          endAt,
          plannedMinutes: chunk,
        });
        dailyMinutes[slot.dateKey] = (dailyMinutes[slot.dateKey] ?? 0) + chunk;
        remaining -= chunk;
        earliestStart = endAt;
        slot.startAt = new Date(endAt.getTime() + input.breakMinutes * MINUTE_MS);
        if (slot.endAt.getTime() - slot.startAt.getTime() < input.minimumSessionMinutes * MINUTE_MS)
          freeSlots.splice(slotIndex, 1);
      }
      if (placedAll) completionTimes.set(task.id, earliestStart ?? new Date(0));
      else {
        unscheduledIds.add(task.id);
        unscheduledTasks.push({
          taskId: task.id,
          taskTitle: task.title,
          remainingMinutes: remaining,
          code: 'NO_VALID_SLOT',
          reason: 'No valid time slot satisfies hard constraints and the daily learning limit.',
        });
      }
    }

    return {
      sessions: sessions.sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
      unscheduledTasks,
      summary: {
        scheduledTasks: new Set(sessions.map((session) => session.taskId)).size,
        scheduledSessions: sessions.length,
        scheduledMinutes: sessions.reduce((sum, session) => sum + session.plannedMinutes, 0),
        unscheduledTasks: unscheduledTasks.length,
      },
    };
  }

  private buildFreeSlots(input: SchedulingInput): MutableSlot[] {
    const slots: MutableSlot[] = [];
    for (const dateKey of eachLocalDate(input.from, input.to)) {
      const weekday = weekdayForDate(dateKey);
      const explicit = input.availabilityRules.filter(
        (rule) =>
          rule.type === AvailabilityType.AVAILABLE &&
          rule.priority === ConstraintPriority.HARD &&
          rule.weekdays.includes(weekday) &&
          this.isEffective(rule, dateKey),
      );
      const base = explicit.length
        ? explicit.map((rule) => this.recurringSlot(rule, dateKey, input.timeZone))
        : [
            {
              startAt: zonedDateTimeToUtc(dateKey, '06:00', input.timeZone),
              endAt: zonedDateTimeToUtc(dateKey, '22:00', input.timeZone),
            },
          ];
      const recurringBlocks = [...input.routines, ...input.availabilityRules]
        .filter(
          (rule) =>
            rule.priority === ConstraintPriority.HARD &&
            rule.type !== AvailabilityType.AVAILABLE &&
            rule.type !== AvailabilityType.PREFERRED &&
            rule.weekdays.includes(weekday) &&
            this.isEffective(rule, dateKey),
        )
        .map((rule) => this.recurringSlot(rule, dateKey, input.timeZone));
      const dayStart = zonedDateTimeToUtc(dateKey, '00:00', input.timeZone);
      const dayEnd = zonedDateTimeToUtc(addLocalDays(dateKey, 1), '00:00', input.timeZone);
      const datedBlocks = input.blockedSlots.filter(
        (block) => block.startAt < dayEnd && block.endAt > dayStart,
      );
      for (const available of base) {
        for (const free of this.subtract(available, [...recurringBlocks, ...datedBlocks])) {
          if (
            free.endAt.getTime() - free.startAt.getTime() >=
            input.minimumSessionMinutes * MINUTE_MS
          )
            slots.push({ ...free, dateKey });
        }
      }
    }
    return slots.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  private recurringSlot(
    rule: SchedulingInput['routines'][number],
    dateKey: string,
    timeZone: string,
  ): TimeSlot {
    let endDate = dateKey;
    if (rule.endTime <= rule.startTime) endDate = addLocalDays(dateKey, 1);
    return {
      startAt: new Date(
        zonedDateTimeToUtc(dateKey, rule.startTime, timeZone).getTime() -
          (rule.bufferBeforeMinutes ?? 0) * MINUTE_MS,
      ),
      endAt: new Date(
        zonedDateTimeToUtc(endDate, rule.endTime, timeZone).getTime() +
          (rule.bufferAfterMinutes ?? 0) * MINUTE_MS,
      ),
    };
  }

  private subtract(base: TimeSlot, blocks: TimeSlot[]): TimeSlot[] {
    let slots = [base];
    const ordered = blocks
      .filter((block) => block.startAt < base.endAt && block.endAt > base.startAt)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    for (const block of ordered) {
      slots = slots.flatMap((slot) => {
        if (block.endAt <= slot.startAt || block.startAt >= slot.endAt) return [slot];
        const result: TimeSlot[] = [];
        if (block.startAt > slot.startAt)
          result.push({ startAt: slot.startAt, endAt: block.startAt });
        if (block.endAt < slot.endAt) result.push({ startAt: block.endAt, endAt: slot.endAt });
        return result;
      });
    }
    return slots;
  }

  private selectSlot(
    slots: MutableSlot[],
    minutes: number,
    earliestStart: Date | undefined,
    dailyMinutes: Record<string, number>,
    maxDailyLearningMinutes: number,
    task: SchedulingTask,
    input: SchedulingInput,
  ): number {
    let selectedIndex = -1;
    let selectedDate = '';
    let selectedScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index]!;
      const start = earliestStart && slot.startAt < earliestStart ? earliestStart : slot.startAt;
      if (
        slot.endAt.getTime() - start.getTime() < minutes * MINUTE_MS ||
        (dailyMinutes[slot.dateKey] ?? 0) + minutes >
          this.dailyLimit(maxDailyLearningMinutes, input.mode, slot.dateKey)
      ) {
        continue;
      }

      const score = this.slotScore(slot, task, input);
      if (
        selectedIndex < 0 ||
        slot.dateKey < selectedDate ||
        (slot.dateKey === selectedDate && score > selectedScore)
      ) {
        selectedIndex = index;
        selectedDate = slot.dateKey;
        selectedScore = score;
      }
    }

    if (selectedIndex < 0) return -1;
    if (earliestStart && slots[selectedIndex]!.startAt < earliestStart)
      slots[selectedIndex]!.startAt = new Date(earliestStart);
    return selectedIndex;
  }

  private slotScore(slot: MutableSlot, task: SchedulingTask, input: SchedulingInput): number {
    const localHour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: input.timeZone,
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(slot.startAt),
    );
    const preferred = (input.preferredStudyTime ?? '').toUpperCase();
    let score = input.preferredStudyDays.includes(weekdayForDate(slot.dateKey)) ? 20 : 0;
    if (preferred.includes('MORNING') && localHour >= 6 && localHour < 12) score += 15;
    if (preferred.includes('AFTERNOON') && localHour >= 12 && localHour < 18) score += 15;
    if (preferred.includes('EVENING') && localHour >= 18 && localHour < 22) score += 15;
    if ((task.difficulty === 'ADVANCED' || task.difficulty === 'EXPERT') && localHour < 12)
      score += 10;
    if (localHour >= 21) score -= 10;
    return score;
  }

  private chunkTask(total: number, preferred: number, minimum: number): number[] {
    if (total < minimum) return [];
    let count = Math.max(1, Math.ceil(total / preferred));
    while (count > 1 && Math.floor(total / count) < minimum) count -= 1;
    const base = Math.floor(total / count);
    const remainder = total % count;
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
  }

  private orderTasks(tasks: SchedulingTask[]): SchedulingTask[] {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ordered: SchedulingTask[] = [];
    const fallback = [...tasks].sort(
      (a, b) =>
        b.priority - a.priority ||
        a.milestoneOrder - b.milestoneOrder ||
        a.moduleOrder - b.moduleOrder ||
        a.order - b.order,
    );
    const visit = (task: SchedulingTask): void => {
      if (visited.has(task.id)) return;
      if (visiting.has(task.id)) throw new Error('Task dependencies contain a cycle.');
      visiting.add(task.id);
      for (const dependencyId of task.dependencyIds) {
        const dependency = byId.get(dependencyId);
        if (dependency) visit(dependency);
      }
      visiting.delete(task.id);
      visited.add(task.id);
      ordered.push(task);
    };
    for (const task of fallback) visit(task);
    return ordered;
  }

  private latestDependencyCompletion(
    task: SchedulingTask,
    completionTimes: Map<string, Date>,
  ): Date | undefined {
    const dates = task.dependencyIds
      .map((id) => completionTimes.get(id))
      .filter((date): date is Date => Boolean(date));
    return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : undefined;
  }

  private dailyLimit(maximum: number, mode: ReschedulingMode, dateKey: string): number {
    if (mode === ReschedulingMode.LOW_STRESS) return Math.max(1, Math.floor(maximum * 0.7));
    const weekday = weekdayForDate(dateKey);
    if (mode === ReschedulingMode.BALANCED && (weekday === 'SATURDAY' || weekday === 'SUNDAY'))
      return Math.max(1, Math.floor(maximum * 0.75));
    return maximum;
  }

  private isEffective(rule: SchedulingInput['routines'][number], dateKey: string): boolean {
    const from = rule.effectiveFrom?.toISOString().slice(0, 10);
    const until = rule.effectiveUntil?.toISOString().slice(0, 10);
    return (!from || dateKey >= from) && (!until || dateKey <= until);
  }
}
