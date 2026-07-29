import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LearningTaskStatus } from '@prisma/client';
import { AuditService } from '@/infrastructure/logging/audit.service';
import { RoadmapGenerationService } from '@/modules/roadmap-jobs/services/roadmap-generation.service';
import type { UpdateRoadmapDto } from '../dto/update-roadmap.dto';
import { RoadmapsRepository } from '../repositories/roadmaps.repository';

@Injectable()
export class RoadmapsService {
  constructor(
    private readonly repository: RoadmapsRepository,
    private readonly generation: RoadmapGenerationService,
    private readonly audit: AuditService,
  ) {}

  list(userId: string) {
    return this.repository.list(userId);
  }

  async get(userId: string, id: string, version?: number) {
    const roadmap = await this.repository.findOwned(userId, id, version);
    if (!roadmap) throw new NotFoundException('Roadmap not found.');
    if (version && !roadmap.versions.length)
      throw new NotFoundException('Roadmap version not found.');
    return roadmap;
  }

  async update(userId: string, id: string, dto: UpdateRoadmapDto) {
    await this.get(userId, id);
    if (!dto.title) throw new BadRequestException('At least one roadmap field must be supplied.');
    const result = await this.repository.updateTitle(userId, id, dto.title.trim());
    void this.audit.record({
      userId,
      action: 'ROADMAP_UPDATED',
      entityType: 'Roadmap',
      entityId: id,
    });
    return result;
  }

  async activate(userId: string, id: string) {
    await this.get(userId, id);
    try {
      const result = await this.repository.activate(userId, id);
      void this.audit.record({
        userId,
        action: 'ROADMAP_ACTIVATED',
        entityType: 'Roadmap',
        entityId: id,
      });
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'ROADMAP_HAS_NO_VERSION')
        throw new BadRequestException('Roadmap has no generated version.');
      throw error;
    }
  }

  async regenerate(userId: string, id: string) {
    const roadmap = await this.get(userId, id);
    return this.generation.start(userId, roadmap.goalId);
  }

  async archive(userId: string, id: string) {
    await this.get(userId, id);
    const result = await this.repository.archive(userId, id);
    void this.audit.record({
      userId,
      action: 'ROADMAP_ARCHIVED',
      entityType: 'Roadmap',
      entityId: id,
    });
    return result;
  }

  async sources(userId: string, id: string, version?: number) {
    const roadmap = await this.get(userId, id, version);
    const resolvedVersion = version ?? roadmap.currentVersionNumber;
    if (!resolvedVersion) return [];
    return this.repository.sources(userId, id, resolvedVersion);
  }

  async progress(userId: string, id: string) {
    const roadmap = await this.get(userId, id);
    const version = roadmap.activeVersionNumber ?? roadmap.currentVersionNumber;
    if (!version) return { version: null, totalTasks: 0, completedTasks: 0, completionRate: 0 };
    const counts = await this.repository.taskCounts(userId, id, version);
    const totalTasks = counts.reduce((sum, row) => sum + row._count._all, 0);
    const completedTasks =
      counts.find((row) => row.status === LearningTaskStatus.COMPLETED)?._count._all ?? 0;
    return {
      version,
      totalTasks,
      completedTasks,
      completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0,
    };
  }
}
