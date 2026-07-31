import { ResourceContentType } from '@/generated/prisma/client';
import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';
import { buildLlmSourceMaterials } from '../domain/roadmap-source-context';

describe('buildLlmSourceMaterials', () => {
  it('keeps all source references while bounding the total LLM source text', () => {
    const sources: SearchResult[] = Array.from({ length: 12 }, (_, index) => ({
      title: `Source ${index + 1}`,
      url: `https://example.com/source-${index + 1}`,
      description: `Useful roadmap content ${'x'.repeat(11_980)}`,
      sourceDomain: 'example.com',
      retrievedAt: new Date('2026-07-30T00:00:00.000Z').toISOString(),
      contentType: ResourceContentType.ARTICLE,
      relevanceScore: 0.9,
      credibilityScore: 0.8,
      language: 'en',
    }));

    const materials = buildLlmSourceMaterials(sources);

    expect(materials).toHaveLength(12);
    expect(materials.every((source) => source.snippet.length <= 2_000)).toBe(true);
    expect(
      materials.reduce((total, source) => total + source.snippet.length, 0),
    ).toBeLessThanOrEqual(24_000);
    expect(materials.map((source) => source.url)).toEqual(sources.map((source) => source.url));
  });
});
