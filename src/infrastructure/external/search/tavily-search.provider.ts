import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResourceContentType } from '@prisma/client';
import { z } from 'zod';
import type { SearchOptions, SearchProvider, SearchResult } from './search-provider.interface';

const tavilyResultSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  content: z.string().default(''),
  score: z.number().finite().default(0),
  published_date: z.string().nullish(),
});

const tavilyResponseSchema = z.object({
  results: z.array(z.unknown()),
});

type SearchDepth = 'basic' | 'advanced' | 'fast' | 'ultra-fast';

@Injectable()
export class TavilySearchProvider implements SearchProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxResults: number;
  private readonly searchDepth: SearchDepth;
  private readonly projectId?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('search.tavily.apiKey', '');
    this.baseUrl = config.get<string>('search.tavily.baseUrl', 'https://api.tavily.com');
    this.timeoutMs = config.get<number>('search.timeoutMs', 30000);
    this.maxResults = config.get<number>('search.maxResults', 12);
    this.searchDepth = config.get<SearchDepth>('search.tavily.searchDepth', 'basic');
    this.projectId = config.get<string>('search.tavily.projectId') || undefined;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) throw new Error('Tavily search query cannot be empty.');
    if (!this.apiKey) throw new Error('TAVILY_API_KEY is required for the Tavily provider.');

    const limit = Math.max(1, Math.min(options.limit ?? this.maxResults, this.maxResults, 20));
    const allowlist = this.normalizeRules(options.allowlist);
    const blocklist = this.normalizeRules(options.blocklist);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.projectId ? { 'X-Project-ID': this.projectId } : {}),
        },
        body: JSON.stringify({
          query: normalizedQuery,
          search_depth: this.searchDepth,
          max_results: limit,
          topic: 'general',
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_favicon: false,
          include_domains: allowlist,
          exclude_domains: blocklist,
          auto_parameters: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with HTTP ${response.status}.`);
      }

      const payload = tavilyResponseSchema.parse(await response.json());
      const retrievedAt = new Date().toISOString();
      const results: SearchResult[] = [];
      for (const candidate of payload.results) {
        const parsed = tavilyResultSchema.safeParse(candidate);
        if (!parsed.success) continue;
        const mapped = this.mapResult(
          parsed.data,
          retrievedAt,
          options.language ?? 'und',
          allowlist,
          blocklist,
        );
        if (mapped) results.push(mapped);
      }
      return results.slice(0, limit);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Tavily search timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapResult(
    result: z.infer<typeof tavilyResultSchema>,
    retrievedAt: string,
    language: string,
    allowlist: string[],
    blocklist: string[],
  ): SearchResult | undefined {
    const url = new URL(result.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    const sourceDomain = this.normalizeDomain(url.hostname);
    const canonicalUrl = url.toString();
    const title = result.title.trim();
    if (!title || canonicalUrl.length > 2048 || sourceDomain.length > 255) return undefined;
    if (this.matchesAny(sourceDomain, blocklist)) return undefined;
    if (allowlist.length && !this.matchesAny(sourceDomain, allowlist)) return undefined;
    const contentType = this.contentType(result.title, url);

    return {
      title: title.slice(0, 500),
      url: canonicalUrl,
      description: result.content.replace(/\s+/g, ' ').trim().slice(0, 4000),
      sourceDomain,
      publishedAt: this.validDate(result.published_date),
      retrievedAt,
      contentType,
      relevanceScore: this.score(result.score),
      credibilityScore: this.credibility(sourceDomain, url.protocol, allowlist),
      language: language.trim().toLowerCase().slice(0, 20) || 'und',
    };
  }

  private contentType(title: string, url: URL): ResourceContentType {
    const value = `${title} ${url.hostname} ${url.pathname}`.toLowerCase();
    if (/\broadmap\b/.test(value)) return ResourceContentType.ROADMAP;
    if (/youtube\.com|youtu\.be|vimeo\.com|\bvideo\b/.test(value)) return ResourceContentType.VIDEO;
    if (/github\.com|gitlab\.com|bitbucket\.org/.test(value)) return ResourceContentType.REPOSITORY;
    if (/\bdocs?\b|documentation|reference|developer\./.test(value))
      return ResourceContentType.DOCUMENTATION;
    if (/\bcourse\b|curriculum|academy/.test(value)) return ResourceContentType.COURSE;
    if (/\bbook\b|handbook|ebook/.test(value)) return ResourceContentType.BOOK;
    return ResourceContentType.ARTICLE;
  }

  private credibility(domain: string, protocol: string, allowlist: string[]): number {
    if (this.matchesAny(domain, allowlist)) return 0.9;
    if (domain.endsWith('.edu') || domain.endsWith('.gov')) return 0.9;
    if (protocol === 'https:') return 0.65;
    return 0.45;
  }

  private validDate(value?: string | null): string | undefined {
    if (!value) return undefined;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
  }

  private normalizeRules(values: string[] = []): string[] {
    return [...new Set(values.map((value) => this.normalizeDomain(value)).filter(Boolean))];
  }

  private normalizeDomain(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return '';
    try {
      const hostname = trimmed.includes('://') ? new URL(trimmed).hostname : trimmed;
      return hostname.replace(/^www\./, '').replace(/\.$/, '');
    } catch {
      return trimmed.replace(/^www\./, '').replace(/\.$/, '');
    }
  }

  private matchesAny(domain: string, rules: string[]): boolean {
    return rules.some((rule) => domain === rule || domain.endsWith(`.${rule}`));
  }

  private score(value: number): number {
    return Math.max(0, Math.min(1, value));
  }
}
