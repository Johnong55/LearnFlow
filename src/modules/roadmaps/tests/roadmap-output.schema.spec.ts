import { RoadmapDifficulty } from '@prisma/client';
import { roadmapOutputSchema } from '../domain/roadmap-output.schema';

describe('roadmap AI output validation', () => {
  const valid = {
    title: 'Validated roadmap',
    summary: 'A sufficiently detailed roadmap summary.',
    estimatedWeeks: 12,
    weeklyHours: 8,
    difficulty: RoadmapDifficulty.INTERMEDIATE,
    assumptions: ['Weekly capacity remains available.'],
    prerequisites: ['Basic foundations'],
    milestones: [
      {
        title: 'Foundations',
        order: 1,
        estimatedHours: 10,
        modules: [
          {
            title: 'Core concepts',
            order: 1,
            estimatedHours: 10,
            sourceUrls: ['https://example.test/source'],
            tasks: [
              {
                title: 'Learn concepts',
                type: 'LEARNING',
                order: 1,
                estimatedMinutes: 60,
                difficulty: 'BEGINNER',
                priority: 3,
              },
            ],
          },
        ],
      },
    ],
  };

  it('accepts valid structured output', () => {
    expect(roadmapOutputSchema.parse(valid)).toMatchObject({ title: 'Validated roadmap' });
  });

  it('rejects invalid AI output before persistence', () => {
    expect(() => roadmapOutputSchema.parse({ ...valid, milestones: [] })).toThrow();
  });

  it('rejects duplicate task order values', () => {
    const duplicateTask = {
      title: 'Duplicate order',
      type: 'PRACTICE',
      order: 1,
      estimatedMinutes: 30,
      difficulty: 'BEGINNER',
      priority: 3,
    };
    const invalid = structuredClone(valid);
    invalid.milestones[0]!.modules[0]!.tasks.push(duplicateTask);
    expect(() => roadmapOutputSchema.parse(invalid)).toThrow('Task order values');
  });
});
