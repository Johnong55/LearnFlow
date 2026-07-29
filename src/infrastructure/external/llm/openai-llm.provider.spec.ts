import { ConfigService } from '@nestjs/config';
import { OpenAiLlmProvider } from './openai-llm.provider';
import type { JsonSchema, LlmRequest } from './llm-provider.interface';

describe('OpenAiLlmProvider', () => {
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

  function provider(): OpenAiLlmProvider {
    return new OpenAiLlmProvider(
      new ConfigService({
        ai: {
          timeoutMs: 5000,
          openai: {
            apiKey: 'sk-test-openai-secret-key',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-5.6-sol',
            reasoningEffort: 'medium',
            maxOutputTokens: 20000,
            projectId: 'project-test',
            organizationId: '',
          },
        },
      }),
    );
  }

  it('requests strict structured output through the Responses API', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'completed',
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: '{"title":"Node.js roadmap"}' }],
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).resolves.toEqual({
      title: 'Node.js roadmap',
    });
    const request = fetchMock.mock.calls[0];
    expect(request?.[0]).toBe('https://api.openai.com/v1/responses');
    const init = request?.[1];
    expect(init?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer sk-test-openai-secret-key',
        'OpenAI-Project': 'project-test',
      }),
    );
    expect(typeof init?.body).toBe('string');
    const requestBody: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    expect(requestBody).toEqual(
      expect.objectContaining({
        model: 'gpt-5.6-sol',
        store: false,
        reasoning: { effort: 'medium' },
        max_output_tokens: 20000,
        safety_identifier: 'privacy-safe-user-id',
        text: {
          format: {
            type: 'json_schema',
            name: 'test_roadmap',
            schema: schema.schema,
            strict: true,
          },
        },
      }),
    );
    expect(JSON.stringify(requestBody)).toContain('Structured context');
    expect(JSON.stringify(requestBody)).toContain('https://nodejs.org/docs');
  });

  it('rejects incomplete output instead of parsing partial JSON', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'incomplete',
          incomplete_details: { reason: 'max_output_tokens' },
          output: [],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'OpenAI response was incomplete (max_output_tokens).',
    );
  });

  it('rejects refusals without exposing provider-generated text', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'completed',
          output: [
            {
              type: 'message',
              content: [{ type: 'refusal', refusal: 'provider-generated reason' }],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'OpenAI refused to generate the requested structured output.',
    );
  });

  it('does not include an OpenAI error body or key in HTTP errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'sensitive provider detail' } }), {
        status: 429,
        headers: { 'x-request-id': 'req_safe_123' },
      }),
    );

    await expect(provider().generateStructuredOutput(input, schema)).rejects.toThrow(
      'OpenAI request failed with HTTP 429 (request req_safe_123).',
    );
  });
});
