import type { ResourceContentType } from '@prisma/client';

export interface SearchOptions {
  language?: string;
  limit?: number;
  allowlist?: string[];
  blocklist?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  sourceDomain: string;
  publishedAt?: string;
  retrievedAt: string;
  contentType: ResourceContentType;
  relevanceScore: number;
  credibilityScore: number;
  language: string;
}

export interface SearchProvider {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER');
