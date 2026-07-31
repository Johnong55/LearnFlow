import { LearningTaskType, RoadmapDifficulty } from '@/generated/prisma/client';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(2).max(250),
  description: z.string().max(5000).optional(),
  type: z.enum(LearningTaskType),
  order: z.number().int().positive(),
  estimatedMinutes: z.number().int().min(5).max(10080),
  difficulty: z.enum(RoadmapDifficulty),
  priority: z.number().int().min(1).max(5),
});

const moduleSchema = z.object({
  title: z.string().min(2).max(250),
  description: z.string().max(5000).optional(),
  order: z.number().int().positive(),
  estimatedHours: z.number().positive().max(10000),
  sourceUrls: z.array(z.url()).min(1).max(20),
  tasks: z.array(taskSchema).min(1).max(100),
});

const milestoneSchema = z.object({
  title: z.string().min(2).max(250),
  description: z.string().max(5000).optional(),
  order: z.number().int().positive(),
  estimatedHours: z.number().positive().max(10000),
  modules: z.array(moduleSchema).min(1).max(50),
});

export const roadmapOutputSchema = z
  .object({
    title: z.string().min(3).max(250),
    summary: z.string().min(10).max(10000),
    estimatedWeeks: z.number().int().positive().max(520),
    weeklyHours: z.number().positive().max(168),
    difficulty: z.enum(RoadmapDifficulty),
    assumptions: z.array(z.string().min(1).max(1000)).max(50),
    prerequisites: z.array(z.string().min(1).max(1000)).max(50),
    milestones: z.array(milestoneSchema).min(1).max(50),
  })
  .superRefine((roadmap, context) => {
    const milestoneTitles = new Set<string>();
    const moduleTitles = new Set<string>();
    const milestoneOrders = roadmap.milestones.map((milestone) => milestone.order);
    if (new Set(milestoneOrders).size !== milestoneOrders.length)
      context.addIssue({ code: 'custom', message: 'Milestone order values must be unique.' });
    for (const milestone of roadmap.milestones) {
      const milestoneTitle = normalizeTitle(milestone.title);
      if (milestoneTitles.has(milestoneTitle))
        context.addIssue({ code: 'custom', message: 'Milestone titles must be unique.' });
      milestoneTitles.add(milestoneTitle);
      const moduleOrders = milestone.modules.map((module) => module.order);
      if (new Set(moduleOrders).size !== moduleOrders.length)
        context.addIssue({
          code: 'custom',
          message: `Module order values in "${milestone.title}" must be unique.`,
        });
      for (const module of milestone.modules) {
        const moduleTitle = normalizeTitle(module.title);
        if (moduleTitles.has(moduleTitle))
          context.addIssue({ code: 'custom', message: 'Module titles must be unique.' });
        moduleTitles.add(moduleTitle);
        const taskOrders = module.tasks.map((task) => task.order);
        if (new Set(taskOrders).size !== taskOrders.length)
          context.addIssue({
            code: 'custom',
            message: `Task order values in "${module.title}" must be unique.`,
          });
      }
    }
  });

export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;

export const roadmapJsonSchema = {
  name: 'personalized_roadmap',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 250 },
      summary: { type: 'string', minLength: 10, maxLength: 10000 },
      estimatedWeeks: { type: 'integer', minimum: 1, maximum: 520 },
      weeklyHours: { type: 'number', exclusiveMinimum: 0, maximum: 168 },
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
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 2, maxLength: 250 },
            description: { type: 'string', maxLength: 5000 },
            order: { type: 'integer', minimum: 1 },
            estimatedHours: { type: 'number', exclusiveMinimum: 0, maximum: 10000 },
            modules: {
              type: 'array',
              minItems: 1,
              maxItems: 50,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string', minLength: 2, maxLength: 250 },
                  description: { type: 'string', maxLength: 5000 },
                  order: { type: 'integer', minimum: 1 },
                  estimatedHours: { type: 'number', exclusiveMinimum: 0, maximum: 10000 },
                  sourceUrls: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 20,
                    items: { type: 'string', pattern: '^https?://' },
                  },
                  tasks: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 100,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        title: {
                          type: 'string',
                          minLength: 2,
                          maxLength: 250,
                          description:
                            'One concrete learning outcome suitable for a single study session.',
                        },
                        description: {
                          type: 'string',
                          maxLength: 5000,
                          description:
                            'Specific concepts or steps to cover and observable evidence of completion.',
                        },
                        type: { type: 'string', enum: Object.values(LearningTaskType) },
                        order: { type: 'integer', minimum: 1 },
                        estimatedMinutes: {
                          type: 'integer',
                          minimum: 5,
                          maximum: 10080,
                          description:
                            'Prefer 25-120 minutes; split broader work into multiple ordered tasks.',
                        },
                        difficulty: { type: 'string', enum: Object.values(RoadmapDifficulty) },
                        priority: { type: 'integer', minimum: 1, maximum: 5 },
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
                required: [
                  'title',
                  'description',
                  'order',
                  'estimatedHours',
                  'sourceUrls',
                  'tasks',
                ],
              },
            },
          },
          required: ['title', 'description', 'order', 'estimatedHours', 'modules'],
        },
      },
    },
    required: [
      'title',
      'summary',
      'estimatedWeeks',
      'weeklyHours',
      'difficulty',
      'assumptions',
      'prerequisites',
      'milestones',
    ],
  },
};

function normalizeTitle(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
