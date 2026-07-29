import { registerAs } from '@nestjs/config';

export default registerAs('search', () => ({
  provider: process.env.SEARCH_PROVIDER ?? 'mock',
  maxResults: Number(process.env.SEARCH_MAX_RESULTS ?? 12),
  timeoutMs: Number(process.env.SEARCH_TIMEOUT_MS ?? 30000),
  allowlist: (process.env.SEARCH_DOMAIN_ALLOWLIST ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  blocklist: (process.env.SEARCH_DOMAIN_BLOCKLIST ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  tavily: {
    apiKey: process.env.TAVILY_API_KEY ?? '',
    baseUrl: process.env.TAVILY_BASE_URL ?? 'https://api.tavily.com',
    searchDepth: process.env.TAVILY_SEARCH_DEPTH ?? 'basic',
    projectId: process.env.TAVILY_PROJECT_ID ?? '',
  },
}));
