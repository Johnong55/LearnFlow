import { Injectable } from '@nestjs/common';
import { GoalStatus, Prisma, RoadmapStatus, RoadmapVersionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';
import type { RoadmapOutput } from '../domain/roadmap-output.schema';

@Injectable()
export class RoadmapsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.roadmap.findMany({
      where: { userId, deletedAt: null },
      include: {
        goal: { include: { skill: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOwned(userId: string, id: string, version?: number) {
    return this.prisma.roadmap.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        goal: { include: { skill: true } },
        versions: {
          where: version ? { version } : undefined,
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            milestones: {
              orderBy: { order: 'asc' },
              include: {
                modules: {
                  orderBy: { order: 'asc' },
                  include: {
                    tasks: { orderBy: { order: 'asc' }, include: { dependencies: true } },
                    sourceReferences: { include: { source: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findByGoalOwned(userId: string, goalId: string) {
    return this.prisma.roadmap.findFirst({ where: { userId, goalId, deletedAt: null } });
  }

  markGenerating(userId: string, goalId: string, title: string) {
    return this.prisma.roadmap.upsert({
      where: { goalId },
      create: { userId, goalId, title, status: RoadmapStatus.GENERATING },
      update: { status: RoadmapStatus.GENERATING, deletedAt: null },
    });
  }

  markGoalAnalyzing(userId: string, goalId: string) {
    return this.prisma.learningGoal.update({
      where: { id: goalId, userId, deletedAt: null },
      data: { status: GoalStatus.ANALYZING },
    });
  }

  async markFailed(userId: string, goalId: string): Promise<void> {
    await this.prisma.roadmap.updateMany({
      where: { userId, goalId },
      data: { status: RoadmapStatus.FAILED },
    });
    await this.prisma.learningGoal.updateMany({
      where: { id: goalId, userId },
      data: { status: GoalStatus.DRAFT },
    });
  }

  loadGenerationContext(userId: string, goalId: string) {
    return this.prisma.learningGoal.findFirst({
      where: { id: goalId, userId, deletedAt: null },
      include: { skill: true, user: { include: { profile: true, preference: true } } },
    });
  }

  async saveGenerated(
    userId: string,
    goalId: string,
    backgroundJobId: string,
    output: RoadmapOutput,
    sources: SearchResult[],
    metadata: Prisma.InputJsonObject,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.roadmapVersion.findUnique({
          where: { generationJobId: backgroundJobId },
          include: { roadmap: true },
        });
        if (existing)
          return {
            roadmapId: existing.roadmapId,
            versionId: existing.id,
            version: existing.version,
          };

        const roadmap = await transaction.roadmap.findFirstOrThrow({
          where: { userId, goalId, deletedAt: null },
        });
        const aggregate = await transaction.roadmapVersion.aggregate({
          where: { roadmapId: roadmap.id },
          _max: { version: true },
        });
        const versionNumber = (aggregate._max.version ?? 0) + 1;
        const version = await transaction.roadmapVersion.create({
          data: {
            roadmapId: roadmap.id,
            generationJobId: backgroundJobId,
            version: versionNumber,
            summary: output.summary,
            estimatedWeeks: output.estimatedWeeks,
            weeklyHours: output.weeklyHours,
            difficulty: output.difficulty,
            assumptions: output.assumptions,
            prerequisites: output.prerequisites,
            generationMetadata: metadata,
          },
        });

        const sourceIds = new Map<string, string>();
        for (const source of sources) {
          const created = await transaction.roadmapSource.create({
            data: {
              versionId: version.id,
              title: source.title,
              url: source.url,
              description: source.description,
              sourceDomain: source.sourceDomain,
              publishedAt: source.publishedAt ? new Date(source.publishedAt) : undefined,
              retrievedAt: new Date(source.retrievedAt),
              contentType: source.contentType,
              relevanceScore: source.relevanceScore,
              credibilityScore: source.credibilityScore,
              language: source.language,
            },
          });
          sourceIds.set(source.url, created.id);
        }

        for (const milestoneData of output.milestones) {
          const milestone = await transaction.roadmapMilestone.create({
            data: {
              versionId: version.id,
              title: milestoneData.title,
              description: milestoneData.description,
              order: milestoneData.order,
              estimatedHours: milestoneData.estimatedHours,
            },
          });
          for (const moduleData of milestoneData.modules) {
            const module = await transaction.roadmapModule.create({
              data: {
                milestoneId: milestone.id,
                title: moduleData.title,
                description: moduleData.description,
                order: moduleData.order,
                estimatedHours: moduleData.estimatedHours,
              },
            });
            const tasks: string[] = [];
            for (const taskData of moduleData.tasks) {
              const task = await transaction.learningTask.create({
                data: { moduleId: module.id, ...taskData },
              });
              tasks.push(task.id);
            }
            for (let index = 1; index < tasks.length; index += 1) {
              await transaction.taskDependency.create({
                data: { taskId: tasks[index]!, prerequisiteId: tasks[index - 1]! },
              });
            }
            for (const url of moduleData.sourceUrls) {
              const sourceId = sourceIds.get(url);
              if (sourceId)
                await transaction.roadmapModuleSource.create({
                  data: { moduleId: module.id, sourceId },
                });
            }
          }
        }

        const nextStatus = roadmap.activeVersionNumber ? RoadmapStatus.ACTIVE : RoadmapStatus.DRAFT;
        await transaction.roadmap.update({
          where: { id: roadmap.id },
          data: { title: output.title, currentVersionNumber: versionNumber, status: nextStatus },
        });
        await transaction.learningGoal.update({
          where: { id: goalId },
          data: { status: GoalStatus.ACTIVE },
        });
        return { roadmapId: roadmap.id, versionId: version.id, version: versionNumber };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  updateTitle(userId: string, id: string, title: string) {
    return this.prisma.roadmap.update({ where: { id, userId, deletedAt: null }, data: { title } });
  }

  async activate(userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const roadmap = await transaction.roadmap.findFirstOrThrow({
        where: { id, userId, deletedAt: null },
      });
      if (!roadmap.currentVersionNumber) throw new Error('ROADMAP_HAS_NO_VERSION');
      await transaction.roadmapVersion.updateMany({
        where: { roadmapId: id, status: RoadmapVersionStatus.ACTIVE },
        data: { status: RoadmapVersionStatus.ARCHIVED },
      });
      await transaction.roadmapVersion.update({
        where: { roadmapId_version: { roadmapId: id, version: roadmap.currentVersionNumber } },
        data: { status: RoadmapVersionStatus.ACTIVE },
      });
      return transaction.roadmap.update({
        where: { id },
        data: { status: RoadmapStatus.ACTIVE, activeVersionNumber: roadmap.currentVersionNumber },
      });
    });
  }

  async archive(userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.roadmap.findFirstOrThrow({ where: { id, userId, deletedAt: null } });
      await transaction.roadmapVersion.updateMany({
        where: { roadmapId: id },
        data: { status: RoadmapVersionStatus.ARCHIVED },
      });
      return transaction.roadmap.update({
        where: { id },
        data: { status: RoadmapStatus.ARCHIVED },
      });
    });
  }

  sources(userId: string, id: string, version: number) {
    return this.prisma.roadmapSource.findMany({
      where: { version: { version, roadmap: { id, userId, deletedAt: null } } },
      orderBy: [{ relevanceScore: 'desc' }, { credibilityScore: 'desc' }],
    });
  }

  taskCounts(userId: string, id: string, versionNumber: number) {
    return this.prisma.learningTask.groupBy({
      by: ['status'],
      where: {
        module: {
          milestone: {
            version: { version: versionNumber, roadmap: { id, userId, deletedAt: null } },
          },
        },
      },
      _count: { _all: true },
    });
  }
}
