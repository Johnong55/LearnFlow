import { LearningTaskType, RoadmapDifficulty } from '@/generated/prisma/client';
import { z } from 'zod';
import type { JsonSchema } from '@/infrastructure/external/llm/llm-provider.interface';
import type { GenerationContext } from '../interfaces/roadmap-pipeline.interface';
import type { RoadmapOutput } from './roadmap-output.schema';

const levelOrder = ['NONE', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const taskExpansionSchema = z.object({
  milestoneOrder: z.number().int().positive(),
  modules: z.array(
    z.object({
      moduleOrder: z.number().int().positive(),
      tasks: z
        .array(
          z.object({
            title: z.string().min(5).max(250),
            description: z.string().min(20).max(5000),
            type: z.enum(LearningTaskType),
            order: z.number().int().positive(),
            estimatedMinutes: z.number().int().min(25).max(120),
            difficulty: z.enum(RoadmapDifficulty),
            priority: z.number().int().min(1).max(5),
          }),
        )
        .min(3)
        .max(12),
    }),
  ),
});

const blueprintSchema = z.object({
  title: z.string().min(3).max(250),
  summary: z.string().min(30).max(10000),
  difficulty: z.enum(RoadmapDifficulty),
  assumptions: z.array(z.string().min(1).max(1000)).max(50),
  prerequisites: z.array(z.string().min(1).max(1000)).max(50),
  milestones: z.array(
    z.object({
      title: z.string().min(3).max(250),
      description: z.string().min(20).max(5000),
      order: z.number().int().positive(),
      estimatedHours: z.number().positive().max(1000),
      learningOutcomes: z.array(z.string().min(5).max(500)).min(2).max(12),
      modules: z
        .array(
          z.object({
            title: z.string().min(3).max(250),
            description: z.string().min(20).max(5000),
            order: z.number().int().positive(),
            estimatedHours: z.number().positive().max(500),
            learningObjectives: z.array(z.string().min(5).max(500)).min(2).max(12),
            sourceUrls: z.array(z.url()).min(1).max(5),
          }),
        )
        .min(2)
        .max(6),
    }),
  ),
});

export type RoadmapBlueprint = z.infer<typeof blueprintSchema>;
export type MilestoneTaskExpansion = z.infer<typeof taskExpansionSchema>;

export interface DetailedRoadmapPlan {
  deadlineWeeks: number;
  plannedWeeks: number;
  deadlineAtRisk: boolean;
  minimumMilestones: number;
  maximumMilestones: number;
  minimumModules: number;
  minimumTasks: number;
  tasksPerModule: number;
  targetLearningMinutes: number;
  difficulty: RoadmapDifficulty;
}

export function createDetailedRoadmapPlan(
  context: GenerationContext,
  now = new Date(),
): DetailedRoadmapPlan {
  const current = Math.max(0, levelOrder.indexOf(context.goal.currentLevel));
  const target = Math.max(current + 1, levelOrder.indexOf(context.goal.targetLevel));
  const levelGap = Math.max(1, target - current);
  const minimumWeeksByGap = [0, 4, 8, 16, 24, 36];
  const minimumWeeks = minimumWeeksByGap[levelGap] ?? 36;
  const deadlineWeeks = Math.max(
    1,
    Math.ceil((context.goal.targetDate.getTime() - now.getTime()) / (7 * 86_400_000)),
  );
  const plannedWeeks = Math.min(
    52,
    Math.max(minimumWeeks, Math.min(deadlineWeeks, minimumWeeks * 2)),
  );
  const minimumMilestones = Math.max(4, Math.min(10, Math.ceil(plannedWeeks / 2.5)));
  const maximumMilestones = Math.min(12, minimumMilestones + 2);
  const targetLearningMinutes = Math.round(plannedWeeks * context.goal.weeklyAvailableHours * 60);
  const minimumTasks = Math.max(minimumMilestones * 6, Math.ceil(targetLearningMinutes / 120));
  const minimumModules = minimumMilestones * 2;
  const tasksPerModule = Math.max(3, Math.min(8, Math.ceil(minimumTasks / minimumModules)));

  return {
    deadlineWeeks,
    plannedWeeks,
    deadlineAtRisk: deadlineWeeks < minimumWeeks,
    minimumMilestones,
    maximumMilestones,
    minimumModules,
    minimumTasks,
    tasksPerModule,
    targetLearningMinutes,
    difficulty: difficultyForLevel(context.goal.targetLevel),
  };
}

export function blueprintJsonSchema(plan: DetailedRoadmapPlan, sourceUrls: string[]): JsonSchema {
  const sourceItems = { type: 'string', enum: [...new Set(sourceUrls)] };
  return {
    name: 'roadmap_curriculum_blueprint',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 3, maxLength: 250 },
        summary: { type: 'string', minLength: 30, maxLength: 10000 },
        difficulty: { type: 'string', enum: Object.values(RoadmapDifficulty) },
        assumptions: {
          type: 'array',
          maxItems: 50,
          items: { type: 'string', minLength: 1, maxLength: 1000 },
        },
        prerequisites: {
          type: 'array',
          maxItems: 50,
          items: { type: 'string', minLength: 1, maxLength: 1000 },
        },
        milestones: {
          type: 'array',
          minItems: plan.minimumMilestones,
          maxItems: plan.maximumMilestones,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string', minLength: 3, maxLength: 250 },
              description: { type: 'string', minLength: 20, maxLength: 5000 },
              order: { type: 'integer', minimum: 1 },
              estimatedHours: { type: 'number', exclusiveMinimum: 0, maximum: 1000 },
              learningOutcomes: {
                type: 'array',
                minItems: 2,
                maxItems: 12,
                items: { type: 'string', minLength: 5, maxLength: 500 },
              },
              modules: {
                type: 'array',
                minItems: 2,
                maxItems: 6,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string', minLength: 3, maxLength: 250 },
                    description: { type: 'string', minLength: 20, maxLength: 5000 },
                    order: { type: 'integer', minimum: 1 },
                    estimatedHours: { type: 'number', exclusiveMinimum: 0, maximum: 500 },
                    learningObjectives: {
                      type: 'array',
                      minItems: 2,
                      maxItems: 12,
                      items: { type: 'string', minLength: 5, maxLength: 500 },
                    },
                    sourceUrls: {
                      type: 'array',
                      minItems: 1,
                      maxItems: 5,
                      items: sourceItems,
                    },
                  },
                  required: [
                    'title',
                    'description',
                    'order',
                    'estimatedHours',
                    'learningObjectives',
                    'sourceUrls',
                  ],
                },
              },
            },
            required: [
              'title',
              'description',
              'order',
              'estimatedHours',
              'learningOutcomes',
              'modules',
            ],
          },
        },
      },
      required: ['title', 'summary', 'difficulty', 'assumptions', 'prerequisites', 'milestones'],
    },
  };
}

export function taskExpansionJsonSchema(
  milestone: RoadmapBlueprint['milestones'][number],
  tasksPerModule: number,
): JsonSchema {
  return {
    name: `roadmap_milestone_${milestone.order}_tasks`,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        milestoneOrder: { type: 'integer', enum: [milestone.order] },
        modules: {
          type: 'array',
          minItems: milestone.modules.length,
          maxItems: milestone.modules.length,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              moduleOrder: {
                type: 'integer',
                enum: milestone.modules.map((module) => module.order),
              },
              tasks: {
                type: 'array',
                minItems: tasksPerModule,
                maxItems: Math.min(12, tasksPerModule + 3),
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string', minLength: 5, maxLength: 250 },
                    description: {
                      type: 'string',
                      minLength: 20,
                      maxLength: 5000,
                    },
                    type: { type: 'string', enum: Object.values(LearningTaskType) },
                    order: { type: 'integer', minimum: 1 },
                    estimatedMinutes: { type: 'integer', minimum: 25, maximum: 120 },
                    difficulty: { type: 'string', enum: Object.values(RoadmapDifficulty) },
                    priority: { type: 'integer', enum: [1, 2, 3, 4, 5] },
                  },
                  required: [
                    'title',
                    'description',
                    'type',
                    'order',
                    'estimatedMinutes',
                    'difficulty',
                    'priority',
                  ],
                },
              },
            },
            required: ['moduleOrder', 'tasks'],
          },
        },
      },
      required: ['milestoneOrder', 'modules'],
    },
  };
}

export function parseBlueprint(value: unknown, plan: DetailedRoadmapPlan): RoadmapBlueprint {
  const blueprint = blueprintSchema.parse(value);
  if (blueprint.milestones.length < plan.minimumMilestones) {
    throw new Error(
      `Roadmap blueprint needs at least ${plan.minimumMilestones} milestones; AI returned ${blueprint.milestones.length}.`,
    );
  }
  const modules = blueprint.milestones.reduce(
    (total, milestone) => total + milestone.modules.length,
    0,
  );
  if (modules < plan.minimumModules) {
    throw new Error(`Roadmap blueprint needs at least ${plan.minimumModules} modules.`);
  }
  assertUniqueOrders(
    blueprint.milestones.map((milestone) => milestone.order),
    'milestone',
  );
  for (const milestone of blueprint.milestones) {
    assertUniqueOrders(
      milestone.modules.map((module) => module.order),
      `module in milestone ${milestone.order}`,
    );
  }
  return blueprint;
}

export function parseTaskExpansion(
  value: unknown,
  milestone: RoadmapBlueprint['milestones'][number],
  tasksPerModule: number,
): MilestoneTaskExpansion {
  const expansion = taskExpansionSchema.parse(normalizeTaskExpansion(value, milestone));
  if (expansion.milestoneOrder !== milestone.order) {
    throw new Error(`AI expanded the wrong milestone: ${expansion.milestoneOrder}.`);
  }
  const byOrder = new Map(expansion.modules.map((module) => [module.moduleOrder, module]));
  for (const module of milestone.modules) {
    const expanded = byOrder.get(module.order);
    if (!expanded) throw new Error(`AI omitted module ${module.order} from milestone expansion.`);
    if (expanded.tasks.length < tasksPerModule) {
      throw new Error(`Module ${module.order} needs at least ${tasksPerModule} detailed tasks.`);
    }
    assertUniqueOrders(
      expanded.tasks.map((task) => task.order),
      `task in module ${module.order}`,
    );
  }
  if (byOrder.size !== milestone.modules.length) {
    throw new Error('AI returned unexpected modules in milestone expansion.');
  }
  return expansion;
}

function normalizeTaskExpansion(
  value: unknown,
  milestone: RoadmapBlueprint['milestones'][number],
): unknown {
  if (!isRecord(value) || !Array.isArray(value.modules)) return value;
  const modules: unknown[] = value.modules;
  return {
    ...value,
    milestoneOrder: milestone.order,
    modules: modules.map((moduleValue) => {
      if (!isRecord(moduleValue) || !Array.isArray(moduleValue.tasks)) return moduleValue;
      const tasks: unknown[] = moduleValue.tasks;
      return {
        ...moduleValue,
        tasks: tasks.map((taskValue, index) => {
          if (!isRecord(taskValue)) return taskValue;
          const estimatedMinutes = numericValue(taskValue.estimatedMinutes);
          const priority = numericValue(taskValue.priority);
          return {
            ...taskValue,
            order: index + 1,
            estimatedMinutes:
              estimatedMinutes === undefined
                ? taskValue.estimatedMinutes
                : clamp(Math.round(estimatedMinutes), 25, 120),
            priority:
              priority === undefined || priority < 1 || priority > 5
                ? priorityForTaskType(taskValue.type)
                : Math.round(priority),
          };
        }),
      };
    }),
  };
}

function priorityForTaskType(type: unknown): number {
  if (type === LearningTaskType.PROJECT || type === LearningTaskType.ASSESSMENT) return 5;
  if (type === LearningTaskType.PRACTICE) return 4;
  if (type === LearningTaskType.LEARNING) return 3;
  return 2;
}

function numericValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function composeDetailedRoadmap(
  blueprint: RoadmapBlueprint,
  expansions: MilestoneTaskExpansion[],
  plan: DetailedRoadmapPlan,
  weeklyHours: number,
): RoadmapOutput {
  const expansionByMilestone = new Map(
    expansions.map((expansion) => [expansion.milestoneOrder, expansion]),
  );
  const milestones = blueprint.milestones.map((milestone) => {
    const expansion = expansionByMilestone.get(milestone.order);
    if (!expansion) throw new Error(`Missing task expansion for milestone ${milestone.order}.`);
    const moduleTasks = new Map(
      expansion.modules.map((module) => [module.moduleOrder, module.tasks]),
    );
    const modules = milestone.modules.map((module) => {
      const tasks = moduleTasks.get(module.order);
      if (!tasks) throw new Error(`Missing task expansion for module ${module.order}.`);
      const estimatedHours = roundHours(
        tasks.reduce((total, task) => total + task.estimatedMinutes, 0) / 60,
      );
      return {
        title: module.title,
        description: `${module.description}\n\nLearning objectives: ${module.learningObjectives.join('; ')}`,
        order: module.order,
        estimatedHours,
        sourceUrls: module.sourceUrls,
        tasks,
      };
    });
    return {
      title: milestone.title,
      description: `${milestone.description}\n\nOutcomes: ${milestone.learningOutcomes.join('; ')}`,
      order: milestone.order,
      estimatedHours: roundHours(
        modules.reduce((total, module) => total + module.estimatedHours, 0),
      ),
      modules,
    };
  });
  const output: RoadmapOutput = {
    title: blueprint.title,
    summary: plan.deadlineAtRisk
      ? `${blueprint.summary}\n\nDeadline risk: the requested ${plan.deadlineWeeks}-week deadline is shorter than the ${plan.plannedWeeks}-week curriculum required for the selected level progression.`
      : blueprint.summary,
    estimatedWeeks: plan.plannedWeeks,
    weeklyHours,
    difficulty: blueprint.difficulty,
    assumptions: blueprint.assumptions,
    prerequisites: blueprint.prerequisites,
    milestones,
  };
  assertRoadmapDepth(output, plan);
  return output;
}

export function assertRoadmapDepth(output: RoadmapOutput, plan: DetailedRoadmapPlan): void {
  const modules = output.milestones.flatMap((milestone) => milestone.modules);
  const tasks = modules.flatMap((module) => module.tasks);
  const minutes = tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  if (output.milestones.length < plan.minimumMilestones) {
    throw new Error(`Detailed roadmap has too few milestones (${output.milestones.length}).`);
  }
  if (modules.length < plan.minimumModules) {
    throw new Error(`Detailed roadmap has too few modules (${modules.length}).`);
  }
  if (tasks.length < plan.minimumTasks) {
    throw new Error(
      `Detailed roadmap has too few tasks (${tasks.length}); expected at least ${plan.minimumTasks}.`,
    );
  }
  if (minutes < plan.targetLearningMinutes * 0.65) {
    throw new Error(
      `Detailed roadmap covers only ${minutes} minutes; expected at least ${Math.ceil(plan.targetLearningMinutes * 0.65)}.`,
    );
  }
}

function difficultyForLevel(level: string): RoadmapDifficulty {
  if (level === 'EXPERT') return RoadmapDifficulty.EXPERT;
  if (level === 'ADVANCED') return RoadmapDifficulty.ADVANCED;
  if (level === 'INTERMEDIATE') return RoadmapDifficulty.INTERMEDIATE;
  return RoadmapDifficulty.BEGINNER;
}

function assertUniqueOrders(values: number[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`AI returned duplicate ${label} order values.`);
  }
}

function roundHours(value: number): number {
  return Math.max(0.1, Math.round(value * 10) / 10);
}
