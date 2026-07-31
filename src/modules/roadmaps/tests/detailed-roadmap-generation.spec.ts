import { MockLlmProvider } from '@/infrastructure/external/llm/mock-llm.provider';
import {
  blueprintJsonSchema,
  composeDetailedRoadmap,
  createDetailedRoadmapPlan,
  parseBlueprint,
  parseTaskExpansion,
  taskExpansionJsonSchema,
} from '../domain/detailed-roadmap-generation';
import type { GenerationContext } from '../interfaces/roadmap-pipeline.interface';

describe('detailed roadmap generation', () => {
  const context: GenerationContext = {
    goal: {
      id: 'goal',
      title: 'Become a Node.js backend developer',
      description: 'Build, test, and deploy a production REST API.',
      currentLevel: 'NONE',
      targetLevel: 'INTERMEDIATE',
      targetDate: new Date('2026-08-01T00:00:00.000Z'),
      weeklyAvailableHours: 8,
      skillName: 'Node.js',
    },
    profile: { timezone: 'Asia/Ho_Chi_Minh', locale: 'vi-VN' },
    preference: {
      preferredSessionMinutes: 60,
      preferredStudyDays: ['MONDAY', 'WEDNESDAY', 'SATURDAY'],
      preferredLearningFormat: 'PROJECT',
    },
  };
  const sources = ['https://nodejs.org/docs', 'https://example.test/node-roadmap'];

  it('does not collapse a comprehensive curriculum into an unrealistic one-week deadline', () => {
    const plan = createDetailedRoadmapPlan(context, new Date('2026-07-30T00:00:00.000Z'));

    expect(plan.deadlineWeeks).toBe(1);
    expect(plan.plannedWeeks).toBe(16);
    expect(plan.deadlineAtRisk).toBe(true);
    expect(plan.minimumMilestones).toBeGreaterThanOrEqual(4);
    expect(plan.minimumTasks).toBeGreaterThanOrEqual(64);
  });

  it('uses multi-pass LLM output to produce enough calendar-sized tasks', async () => {
    const provider = new MockLlmProvider();
    const plan = createDetailedRoadmapPlan(context, new Date('2026-07-30T00:00:00.000Z'));
    const blueprintValue = await provider.generateStructuredOutput<unknown>(
      {
        systemPrompt: 'blueprint',
        userPrompt: context.goal.description,
        context: {
          generationStage: 'CURRICULUM_BLUEPRINT',
          skillName: context.goal.skillName,
          currentLevel: context.goal.currentLevel,
          targetLevel: context.goal.targetLevel,
          weeklyHours: context.goal.weeklyAvailableHours,
          plannedWeeks: plan.plannedWeeks,
          minimumMilestones: plan.minimumMilestones,
          targetLearningHours: plan.targetLearningMinutes / 60,
          sourceUrls: sources,
        },
      },
      blueprintJsonSchema(plan, sources),
    );
    const blueprint = parseBlueprint(blueprintValue, plan);
    const milestoneBudgetHours = plan.targetLearningMinutes / 60 / blueprint.milestones.length;
    const expansions = await Promise.all(
      blueprint.milestones.map(async (milestone) => {
        const value = await provider.generateStructuredOutput<unknown>(
          {
            systemPrompt: 'expand',
            userPrompt: milestone.title,
            context: {
              generationStage: 'MILESTONE_TASK_EXPANSION',
              targetLevel: context.goal.targetLevel,
              tasksPerModule: plan.tasksPerModule,
              milestoneBudgetHours,
              milestone,
            },
          },
          taskExpansionJsonSchema(milestone, plan.tasksPerModule),
        );
        return parseTaskExpansion(value, milestone, plan.tasksPerModule);
      }),
    );
    const roadmap = composeDetailedRoadmap(
      blueprint,
      expansions,
      plan,
      context.goal.weeklyAvailableHours,
    );
    const tasks = roadmap.milestones.flatMap((milestone) =>
      milestone.modules.flatMap((module) => module.tasks),
    );

    expect(roadmap.estimatedWeeks).toBe(16);
    expect(roadmap.milestones.length).toBeGreaterThanOrEqual(plan.minimumMilestones);
    expect(tasks.length).toBeGreaterThanOrEqual(plan.minimumTasks);
    expect(tasks.every((task) => task.estimatedMinutes >= 25 && task.estimatedMinutes <= 120)).toBe(
      true,
    );
    expect(roadmap.summary).toContain('Deadline risk');
  });

  it('repairs bounded numeric task fields without trusting invalid model values', () => {
    const milestone = {
      title: 'Node.js foundations',
      description: 'Learn the runtime and build a small command-line application.',
      order: 1,
      estimatedHours: 8,
      learningOutcomes: ['Explain the runtime', 'Build a working application'],
      modules: [
        {
          title: 'Runtime basics',
          description: 'Understand Node.js runtime behavior and core APIs.',
          order: 1,
          estimatedHours: 8,
          learningObjectives: ['Use core APIs', 'Explain the event loop'],
          sourceUrls: ['https://nodejs.org/docs'],
        },
      ],
    };
    const tasks = [
      {
        title: 'Read the runtime guide',
        description: 'Write notes that explain the runtime and event loop with examples.',
        type: 'LEARNING',
        order: 8,
        estimatedMinutes: 10,
        difficulty: 'BEGINNER',
        priority: 8,
      },
      {
        title: 'Build a runtime exercise',
        description: 'Create and run an exercise that demonstrates asynchronous execution.',
        type: 'PRACTICE',
        order: 8,
        estimatedMinutes: 180,
        difficulty: 'BEGINNER',
        priority: 7,
      },
      {
        title: 'Review the exercise output',
        description: 'Document the observed execution order and correct any misunderstanding.',
        type: 'REVIEW',
        order: 8,
        estimatedMinutes: 45,
        difficulty: 'BEGINNER',
        priority: 6,
      },
    ];

    const expansion = parseTaskExpansion(
      { milestoneOrder: 99, modules: [{ moduleOrder: 1, tasks }] },
      milestone,
      3,
    );

    expect(expansion.milestoneOrder).toBe(1);
    expect(expansion.modules[0]?.tasks.map((task) => task.order)).toEqual([1, 2, 3]);
    expect(expansion.modules[0]?.tasks.map((task) => task.estimatedMinutes)).toEqual([25, 120, 45]);
    expect(expansion.modules[0]?.tasks.map((task) => task.priority)).toEqual([3, 4, 2]);
  });
});
