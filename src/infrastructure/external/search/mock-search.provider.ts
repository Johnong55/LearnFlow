import { Injectable } from '@nestjs/common';
import { ResourceContentType } from '@prisma/client';
import { slugify } from '@/common/utils/slug.utils';
import type { SearchOptions, SearchProvider, SearchResult } from './search-provider.interface';

@Injectable()
export class MockSearchProvider implements SearchProvider {
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const slug = slugify(query).slice(0, 100);
    const now = new Date().toISOString();
    const candidates: SearchResult[] = [
      {
        title: `Structured roadmap: ${query}`,
        url: `https://learnflow.local/mock-resources/${slug}/roadmap`,
        description:
          'A staged learning roadmap covering foundations, applied practice, projects, and assessment.',
        sourceDomain: 'learnflow.local',
        retrievedAt: now,
        contentType: ResourceContentType.ROADMAP,
        relevanceScore: 0.94,
        credibilityScore: 0.85,
        language: options.language ?? 'en',
      },
      {
        title: `Official-style documentation path: ${query}`,
        url: `https://learnflow.local/mock-resources/${slug}/documentation`,
        description:
          'Reference-oriented material with core concepts, examples, and recommended practice topics.',
        sourceDomain: 'learnflow.local',
        retrievedAt: now,
        contentType: ResourceContentType.DOCUMENTATION,
        relevanceScore: 0.88,
        credibilityScore: 0.92,
        language: options.language ?? 'en',
      },
    ];
    const allowed = candidates.filter((result) => {
      if (options.blocklist?.includes(result.sourceDomain)) return false;
      return !options.allowlist?.length || options.allowlist.includes(result.sourceDomain);
    });
    return Promise.resolve(allowed.slice(0, options.limit ?? allowed.length));
  }
}
