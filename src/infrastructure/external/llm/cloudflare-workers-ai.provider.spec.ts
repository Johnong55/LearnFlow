import { ConfigService } from '@nestjs/config';
import { CloudflareWorkersAiProvider } from './cloudflare-workers-ai.provider';
import type { JsonSchema, LlmRequest } from './llm-provider.interface';

describe('CloudflareWorkersAiProvider', () => {
  const input: LlmRequest = {
    systemPrompt: 'Create a grounded roadmap.',
    userPrompt: 'Learn Node.js.',
    context: { sourceUrls: ['https://nodejs.org/docs'] },
    safetyIdentifier: 'privacy-safe-user-id',
  };
  const schema: JsonSchema = {
    name: 'test_roadmap',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: { title: { type: 'string' } },
      required: ['title'],
    },
  };

  afterEach(() => jest.restoreAllMocks());

  function provider(): CloudflareWorkersAiProvider {
    return new CloudflareWorkersAiProvider(
      new ConfigService({
        ai: {
          timeoutMs: 5000,
          cloudflare: {
            accountId: '0123456789abcdef0123456789abcdef',
            apiToken: 'cloudflare-test-api-token-secret',
            baseUrl: 'https://api.cloudflare.com/client/v4',
            model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
            maxTokens: 8192,
            temperature: 0.2,
          },
        },
      }),
    );
  }

  it('requests JSON Schema output through the Workers AI REST API', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: { response: { title: 'Node.js roadmap' }, usage: { total_tokens: 42 } },
          errors: [],
          messages: [],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).resolves.toEqual({
      title: 'Node.js roadmap',
    });
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe(
      'https://api.cloudflare.com/client/v4/accounts/0123456789abcdef0123456789abcdef/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    );
    const init = request?.[1];
    expect(init?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer cloudflare-test-api-token-secret',
        'Content-Type': 'application/json',
      }),
    );
    expect(typeof init?.body).toBe('string');
    const requestBody: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    expect(requestBody).toEqual(
      expect.objectContaining({
        response_format: { type: 'json_schema', json_schema: schema.schema },
        max_tokens: 8192,
        temperature: 0.2,
        stream: false,
      }),
    );
    expect(JSON.stringify(requestBody)).toContain('Structured context');
    expect(JSON.stringify(requestBody)).toContain('https://nodejs.org/docs');
    expect(JSON.stringify(requestBody)).not.toContain('privacy-safe-user-id');
  });

  it('parses a JSON string returned by a text-generation model', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: { response: '{"title":"String response roadmap"}' },
          errors: [],
          messages: [],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).resolves.toEqual({
      title: 'String response roadmap',
    });
  });

  it('rejects invalid JSON returned by the model', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          result: { response: 'not-json' },
          errors: [],
          messages: [],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'Cloudflare Workers AI structured output was not valid JSON.',
    );
  });

  it('does not include a Cloudflare error body or token in HTTP errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: 'sensitive provider detail' }] }), {
        status: 429,
        headers: { 'cf-ray': 'safe-ray-123' },
      }),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'Cloudflare Workers AI request failed with HTTP 429 (ray safe-ray-123).',
    );
  });

  it('reports a sanitized Cloudflare error code from a successful HTTP response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          result: null,
          errors: [{ code: 7003, message: 'sensitive provider detail' }],
          messages: [],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'Cloudflare Workers AI request failed (7003).',
    );
  });
});
