import { ConfigService } from '@nestjs/config';
import { ResourceContentType } from '@/generated/prisma/client';
import { TavilySearchProvider } from './tavily-search.provider';

describe('TavilySearchProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  function provider(overrides: Record<string, unknown> = {}): TavilySearchProvider {
    return new TavilySearchProvider(
      new ConfigService({
        search: {
          timeoutMs: 5000,
          maxResults: 12,
          tavily: {
            apiKey: 'tvly-test-secret-key',
            baseUrl: 'https://api.tavily.com',
            searchDepth: 'basic',
            projectId: 'learnflow-tests',
          },
          ...overrides,
        },
      }),
    );
  }

  it('maps snippets and enforces domain policy after the provider response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: 'Node.js API documentation',
              url: 'https://docs.nodejs.org/api/',
              content: '  Official   API reference. ',
              score: 1.4,
              published_date: '2026-01-10',
            },
            {
              title: 'Blocked result',
              url: 'https://tracking.nodejs.org/roadmap',
              content: 'Must be removed locally.',
              score: 0.8,
            },
            { title: 'Malformed URL', url: 'not-a-url', content: '', score: 0.2 },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const results = await provider().search(' Node.js backend roadmap ', {
      language: 'EN-US',
      limit: 4,
      allowlist: ['https://nodejs.org'],
      blocklist: ['tracking.nodejs.org'],
    });

    expect(results).toEqual([
      expect.objectContaining({
        title: 'Node.js API documentation',
        url: 'https://docs.nodejs.org/api/',
        description: 'Official API reference.',
        sourceDomain: 'docs.nodejs.org',
        publishedAt: '2026-01-10T00:00:00.000Z',
        contentType: ResourceContentType.DOCUMENTATION,
        relevanceScore: 1,
        credibilityScore: 0.9,
        language: 'en-us',
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe('https://api.tavily.com/search');
    const init = request?.[1];
    expect(init?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer tvly-test-secret-key',
        'X-Project-ID': 'learnflow-tests',
      }),
    );
    expect(typeof init?.body).toBe('string');
    const requestBody: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    expect(requestBody).toEqual(
      expect.objectContaining({
        query: 'Node.js backend roadmap',
        search_depth: 'basic',
        max_results: 4,
        include_raw_content: 'markdown',
        include_domains: ['nodejs.org'],
        exclude_domains: ['tracking.nodejs.org'],
      }),
    );
  });

  it('reports provider HTTP failures without exposing the response body or API key', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: { error: 'secret provider detail' } }), {
        status: 401,
      }),
    );

    await expect(provider().search('TypeScript roadmap')).rejects.toThrow(
      'Tavily search failed with HTTP 401.',
    );
  });

  it('rejects empty queries before making a network request', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');
    await expect(provider().search('   ')).rejects.toThrow('Tavily search query cannot be empty.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
