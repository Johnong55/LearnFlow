import type { SearchResult } from '@/infrastructure/external/search/search-provider.interface';

export type LlmSourceMaterial = {
  title: string;
  url: string;
  snippet: string;
  contentType: string;
  relevanceScore: number;
  credibilityScore: number;
};

const DEFAULT_TOTAL_SNIPPET_CHARACTERS = 24_000;
const MINIMUM_SNIPPET_CHARACTERS = 500;
const MAXIMUM_SNIPPET_CHARACTERS = 3_000;

export function buildLlmSourceMaterials(
  sources: SearchResult[],
  totalSnippetCharacters = DEFAULT_TOTAL_SNIPPET_CHARACTERS,
): LlmSourceMaterial[] {
  if (!sources.length) return [];
  const safeTotal = Math.max(MINIMUM_SNIPPET_CHARACTERS, totalSnippetCharacters);
  const perSource = Math.max(
    MINIMUM_SNIPPET_CHARACTERS,
    Math.min(MAXIMUM_SNIPPET_CHARACTERS, Math.floor(safeTotal / sources.length)),
  );

  return sources.map((source) => ({
    title: source.title,
    url: source.url,
    snippet: source.description.replace(/\s+/g, ' ').trim().slice(0, perSource),
    contentType: source.contentType,
    relevanceScore: source.relevanceScore,
    credibilityScore: source.credibilityScore,
  }));
}
