import { ConfigService } from '@nestjs/config';
import { GeminiLlmProvider } from './gemini-llm.provider';
import type { JsonSchema, LlmRequest } from './llm-provider.interface';

describe('GeminiLlmProvider', () => {
  const input: LlmRequest = {
    systemPrompt: 'Create a source-grounded roadmap.',
    userPrompt: 'Learn Node.js backend development.',
    context: { sourceUrls: ['https://nodejs.org/docs'] },
    safetyIdentifier: 'must-not-be-sent',
  };
  const schema: JsonSchema = {
    name: 'roadmap',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 3, maxLength: 100 },
        hours: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
        sourceUrl: {
          type: 'string',
          enum: Array.from(
            { length: 12 },
            (_, index) => `https://example.com/long-roadmap-source-${index + 1}`,
          ),
        },
      },
      required: ['title', 'hours'],
    },
  };

  afterEach(() => jest.restoreAllMocks());

  function provider(maxRetries = 0): GeminiLlmProvider {
    return new GeminiLlmProvider(
      new ConfigService({
        ai: {
          timeoutMs: 5000,
          gemini: {
            apiKey: 'gemini-test-api-key-that-is-never-logged',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            model: 'gemini-2.5-flash',
            fastModel: 'gemini-2.5-flash-lite',
            maxOutputTokens: 32768,
            maxRetries,
            retryBaseDelayMs: 0,
            retryMaxDelayMs: 1,
          },
        },
      }),
    );
  }

  it('requests Gemini JSON structured output and removes unsupported schema keywords', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: '{"title":"Node.js roadmap","hours":80}' }] },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).resolves.toEqual({
      title: 'Node.js roadmap',
      hours: 80,
    });

    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
    expect(request?.[1]?.headers).toEqual(
      expect.objectContaining({
        'x-goog-api-key': 'gemini-test-api-key-that-is-never-logged',
        'Content-Type': 'application/json',
      }),
    );
    const rawBody = request?.[1]?.body;
    expect(typeof rawBody).toBe('string');
    const body = JSON.parse(typeof rawBody === 'string' ? rawBody : '{}') as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      generationConfig: {
        maxOutputTokens: 32768,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            hours: { type: 'number' },
            sourceUrl: { type: 'string' },
          },
          required: ['title', 'hours'],
        },
      },
    });
    expect(JSON.stringify(body)).toContain('https://nodejs.org/docs');
    expect(JSON.stringify(body)).not.toContain('must-not-be-sent');
    expect(JSON.stringify(body)).not.toContain('minLength');
    expect(JSON.stringify(body)).not.toContain('exclusiveMinimum');
    expect(JSON.stringify(body)).not.toContain('maximum');
    expect(JSON.stringify(body)).not.toContain('minItems');
    expect(JSON.stringify(body)).not.toContain('long-roadmap-source');
  });

  it('uses the fast model for a FAST inference request', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"title":"Fast","hours":10}' }] } }],
        }),
        { status: 200 },
      ),
    );

    await provider().generateStructuredOutput({ ...input, inferenceProfile: 'FAST' }, schema);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    );
  });

  it('reports a sanitized Gemini HTTP error without exposing provider details', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            message: 'sensitive quota and project details',
          },
        }),
        { status: 429 },
      ),
    );

    const promise = provider().generateStructuredOutput(input, schema);
    await expect(promise).rejects.toThrow(
      'Gemini request failed with HTTP 429 (RESOURCE_EXHAUSTED).',
    );
    await expect(promise).rejects.not.toThrow('sensitive quota and project details');
  });

  it('retries transient 503 responses and returns the later successful result', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 503, status: 'UNAVAILABLE' } }), {
          status: 503,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"title":"Recovered","hours":20}' }] } }],
          }),
          { status: 200 },
        ),
      );

    await expect(provider(1).generateStructuredOutput(input, schema)).resolves.toEqual({
      title: 'Recovered',
      hours: 20,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports prompt safety blocks', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [], promptFeedback: { blockReason: 'SAFETY' } }),
          { status: 200 },
        ),
      );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'Gemini blocked the request (SAFETY).',
    );
  });
});
