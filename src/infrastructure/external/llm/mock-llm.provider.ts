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
