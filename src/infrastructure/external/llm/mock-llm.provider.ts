import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { LlmProvider, LlmRequest, JsonSchema } from './llm-provider.interface';

const contextSchema = z.object({
  skillName: z.string().min(1),
  currentLevel: z.string().min(1),
  targetLevel: z.string().min(1),
  weeklyHours: z.number().positive(),
  estimatedWeeks: z.number().int().positive(),
  sourceUrls: z.array(z.url()).min(1),
});

@Injectable()
export class MockLlmProvider implements LlmProvider {
  generateStructuredOutput<T>(input: LlmRequest, schema: JsonSchema): Promise<T> {
    void schema;
    const stage = input.context?.generationStage;
    if (input.context && stage === 'CURRICULUM_BLUEPRINT') {
      return Promise.resolve(this.blueprint(input.context) as T);
    }
    if (input.context && stage === 'MILESTONE_TASK_EXPANSION') {
      return Promise.resolve(this.expansion(input.context) as T);
    }
    const context = contextSchema.parse(input.context);
    const primarySource = context.sourceUrls[0]!;
    const secondarySource = context.sourceUrls[1] ?? primarySource;
    const output = {
      title: `Personalized ${context.skillName} Roadmap`,
      summary: `Progress from ${context.currentLevel} to ${context.targetLevel} through foundations, applied practice, and a portfolio project.`,
      estimatedWeeks: context.estimatedWeeks,
      weeklyHours: context.weeklyHours,
      difficulty: this.difficulty(context.targetLevel),
      assumptions: [
        'The learner follows the declared weekly capacity.',
        'Essential life routines remain protected.',
      ],
      prerequisites:
        context.currentLevel === 'NONE'
          ? ['Basic computer literacy']
          : [`Existing ${context.currentLevel.toLowerCase()} experience`],
      milestones: [
        this.milestone(1, `${context.skillName} Foundations`, 12, primarySource, 'BEGINNER'),
        this.milestone(2, `Applied ${context.skillName}`, 18, secondarySource, 'INTERMEDIATE'),
        this.milestone(
          3,
          `${context.skillName} Portfolio Project`,
          24,
          primarySource,
          this.difficulty(context.targetLevel),
        ),
      ],
    };
    return Promise.resolve(output as T);
  }

  private blueprint(contextValue: Record<string, unknown>) {
    const context = z
      .object({
        skillName: z.string().min(1),
        currentLevel: z.string().min(1),
        targetLevel: z.string().min(1),
        weeklyHours: z.number().positive(),
        plannedWeeks: z.number().int().positive(),
        minimumMilestones: z.number().int().min(1),
        targetLearningHours: z.number().positive(),
        sourceUrls: z.array(z.url()).min(1),
      })
      .parse(contextValue);
    const hours = context.targetLearningHours / context.minimumMilestones;
    return {
      title: `Detailed ${context.skillName} learning roadmap`,
      summary: `A comprehensive ${context.plannedWeeks}-week curriculum from ${context.currentLevel} to ${context.targetLevel}, combining concepts, guided practice, assessment, and projects.`,
      difficulty: this.difficulty(context.targetLevel),
      assumptions: ['The learner follows the declared weekly learning capacity.'],
      prerequisites:
        context.currentLevel === 'NONE'
          ? ['Basic computer literacy']
          : [`Existing ${context.currentLevel.toLowerCase()} knowledge`],
      milestones: Array.from({ length: context.minimumMilestones }, (_, index) => {
        const order = index + 1;
        return {
          title: `${context.skillName} stage ${order}`,
          description: `Build and demonstrate the competencies required for ${context.skillName} stage ${order}.`,
          order,
          estimatedHours: hours,
          learningOutcomes: [
            `Explain the core ideas in ${context.skillName} stage ${order}`,
            `Apply stage ${order} concepts in a working artifact`,
          ],
          modules: [1, 2].map((moduleOrder) => ({
            title: `${context.skillName} stage ${order} module ${moduleOrder}`,
            description: `A guided and practical module for stage ${order}, part ${moduleOrder}.`,
            order: moduleOrder,
            estimatedHours: hours / 2,
            learningObjectives: [
              `Understand stage ${order} module ${moduleOrder} concepts`,
              `Produce evidence for stage ${order} module ${moduleOrder}`,
            ],
            sourceUrls: [
              context.sourceUrls[(index * 2 + moduleOrder - 1) % context.sourceUrls.length]!,
            ],
          })),
        };
      }),
    };
  }

  private expansion(contextValue: Record<string, unknown>) {
    const context = z
      .object({
        tasksPerModule: z.number().int().min(3).max(12),
        milestoneBudgetHours: z.number().positive(),
        milestone: z.object({
          order: z.number().int().positive(),
          title: z.string(),
          modules: z.array(
            z.object({
              order: z.number().int().positive(),
              title: z.string(),
            }),
          ),
        }),
        targetLevel: z.string(),
      })
      .parse(contextValue);
    const duration = Math.max(
      25,
      Math.min(
        120,
        Math.round(
          (context.milestoneBudgetHours * 60) /
            (context.milestone.modules.length * context.tasksPerModule),
        ),
      ),
    );
    const taskTypes = ['LEARNING', 'PRACTICE', 'PROJECT', 'ASSESSMENT', 'REVIEW'] as const;
    return {
      milestoneOrder: context.milestone.order,
      modules: context.milestone.modules.map((module) => ({
        moduleOrder: module.order,
        tasks: Array.from({ length: context.tasksPerModule }, (_, index) => ({
          title: `${module.title}: concrete outcome ${index + 1}`,
          description: `Complete the specific concepts and guided steps for outcome ${index + 1}, then provide notes, passing checks, or a working artifact as evidence.`,
          type: taskTypes[index % taskTypes.length],
          order: index + 1,
          estimatedMinutes: duration,
          difficulty: this.difficulty(context.targetLevel),
          priority: index === context.tasksPerModule - 1 ? 5 : 4,
        })),
      })),
    };
  }

  private milestone(
    order: number,
    title: string,
    hours: number,
    sourceUrl: string,
    difficulty: string,
  ) {
    return {
      title,
      description: `Complete the ${title.toLowerCase()} stage with measurable practice.`,
      order,
      estimatedHours: hours,
      modules: [
        {
          title,
          description: `Guided module for ${title.toLowerCase()}.`,
          order: 1,
          estimatedHours: hours,
          sourceUrls: [sourceUrl],
          tasks: [
            {
              title: `Study ${title}`,
              description: 'Learn and summarize the core concepts.',
              type: 'LEARNING',
              order: 1,
              estimatedMinutes: Math.round(hours * 30),
              difficulty,
              priority: 4,
            },
            {
              title: `Practice ${title}`,
              description: 'Apply the concepts in a concrete exercise.',
              type: order === 3 ? 'PROJECT' : 'PRACTICE',
              order: 2,
              estimatedMinutes: Math.round(hours * 30),
              difficulty,
              priority: 4,
            },
          ],
        },
      ],
    };
  }

  private difficulty(targetLevel: string): string {
    if (targetLevel === 'EXPERT') return 'EXPERT';
    if (targetLevel === 'ADVANCED') return 'ADVANCED';
    if (targetLevel === 'INTERMEDIATE') return 'INTERMEDIATE';
    return 'BEGINNER';
  }
}
