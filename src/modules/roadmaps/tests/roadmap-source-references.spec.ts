import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';
import { ResourceContentType } from '@/generated/prisma/client';
import {
  normalizeRoadmapSourceReferences,
  roadmapSchemaForSources,
} from '../domain/roadmap-source-references';

const sources: SearchResult[] = [
  {
    title: 'Official Node.js asynchronous programming guide',
    url: 'https://nodejs.org/en/learn/asynchronous-work',
    description: 'Promises async await and event loop documentation.',
    sourceDomain: 'nodejs.org',
    retrievedAt: '2026-07-30T00:00:00.000Z',
    contentType: ResourceContentType.DOCUMENTATION,
    relevanceScore: 0.95,
    credibilityScore: 0.95,
    language: 'en',
  },
  {
    title: 'Node.js project roadmap',
    url: 'https://roadmap.sh/nodejs',
    description: 'Practical projects and backend topics.',
    sourceDomain: 'roadmap.sh',
    retrievedAt: '2026-07-30T00:00:00.000Z',
    contentType: ResourceContentType.ROADMAP,
    relevanceScore: 0.8,
    credibilityScore: 0.75,
    language: 'en',
  },
];

describe('roadmap source reference safeguards', () => {
  it('constrains the provider schema to exact search-result URLs', () => {
    const generated = roadmapSchemaForSources(sources.map((source) => source.url));
    const serialized = JSON.stringify(generated.schema);

    expect(serialized).toContain('https://nodejs.org/en/learn/asynchronous-work');
    expect(serialized).toContain('"enum"');
  });

  it('replaces invalid or invented AI URLs with a relevant trusted source', () => {
    const result = normalizeRoadmapSourceReferences(
      {
        title: 'Node.js roadmap',
        milestones: [
          {
            title: 'Async foundations',
            modules: [
              {
                title: 'Promises and async await',
                description: 'Learn asynchronous programming.',
                sourceUrls: ['nodejs docs', 'https://invented.example/course'],
              },
            ],
          },
        ],
      },
      sources,
    );
    const output = result.output as {
      milestones: Array<{ modules: Array<{ sourceUrls: string[] }> }>;
    };

    expect(result.repairedModules).toBe(1);
    expect(output.milestones[0]?.modules[0]?.sourceUrls).toEqual([
      'https://nodejs.org/en/learn/asynchronous-work',
    ]);
  });

  it('preserves exact allowed URLs and removes unapproved additions', () => {
    const result = normalizeRoadmapSourceReferences(
      {
        milestones: [
          {
            modules: [
              {
                title: 'Project',
                sourceUrls: [sources[1]!.url, 'https://invented.example'],
              },
            ],
          },
        ],
      },
      sources,
    );
    const output = result.output as {
      milestones: Array<{ modules: Array<{ sourceUrls: string[] }> }>;
    };

    expect(output.milestones[0]?.modules[0]?.sourceUrls).toEqual([sources[1]!.url]);
  });
});
