import { LearningTaskType, RoadmapDifficulty } from '@prisma/client';
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
    const milestoneOrders = roadmap.milestones.map((milestone) => milestone.order);
    if (new Set(milestoneOrders).size !== milestoneOrders.length)
      context.addIssue({ code: 'custom', message: 'Milestone order values must be unique.' });
    for (const milestone of roadmap.milestones) {
      const moduleOrders = milestone.modules.map((module) => module.order);
      if (new Set(moduleOrders).size !== moduleOrders.length)
        context.addIssue({
          code: 'custom',
          message: `Module order values in "${milestone.title}" must be unique.`,
        });
      for (const module of milestone.modules) {
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
