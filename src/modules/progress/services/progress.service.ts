import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateProgress } from '../domain/progress-calculator';
import { ProgressRepository } from '../repositories/progress.repository';

@Injectable()
export class ProgressService {
  constructor(private readonly repository: ProgressRepository) {}

  async overview(userId: string) {
    const goals = await this.repository.listGoalIds(userId);
    const progress = await Promise.all(goals.map((goal) => this.goalData(userId, goal.id)));
    return {
      goals: progress,
      totals: {
        plannedLearningMinutes: progress.reduce(
          (sum, item) => sum + item.metrics.plannedLearningMinutes,
          0,
        ),
        actualLearningMinutes: progress.reduce(
          (sum, item) => sum + item.metrics.actualLearningMinutes,
          0,
        ),
        completedTasks: progress.reduce((sum, item) => sum + item.metrics.completedTasks, 0),
        totalTasks: progress.reduce((sum, item) => sum + item.metrics.totalTasks, 0),
      },
    };
  }

  async weekly(userId: string) {
    const overview = await this.overview(userId);
    return {
      goals: overview.goals.map((item) => ({
        goal: item.goal,
        currentStreak: item.metrics.currentStreak,
        weeklyConsistency: item.metrics.weeklyConsistency,
        scheduleAdherenceRate: item.metrics.scheduleAdherenceRate,
        days: item.metrics.weekly,
      })),
    };
  }

  async goal(userId: string, goalId: string) {
    return this.goalData(userId, goalId);
  }

  async snapshotAll(now = new Date()): Promise<number> {
    const goals = await this.repository.listAllGoalOwners();
    let created = 0;
    for (const goal of goals) {
      const record = await this.repository.inputForGoal(goal.userId, goal.id, now);
      if (!record?.roadmapId) continue;
      const metrics = calculateProgress(record.input);
      await this.repository.saveSnapshot(
        goal.userId,
        goal.id,
        record.roadmapId,
        metrics,
        new Date(now.getTime() - 7 * 86_400_000),
        now,
      );
      created += 1;
    }
    return created;
  }

  private async goalData(userId: string, goalId: string, now = new Date()) {
    const record = await this.repository.inputForGoal(userId, goalId, now);
    if (!record) throw new NotFoundException('Learning goal not found.');
    return {
      goal: record.goal,
      roadmapId: record.roadmapId,
      metrics: calculateProgress(record.input),
    };
  }
}
