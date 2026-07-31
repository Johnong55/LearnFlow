import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { JsonSchema, LlmProvider, LlmRequest } from './llm-provider.interface';

const cloudflareErrorSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
});

const responseEnvelopeSchema = z.object({
  success: z.boolean(),
  result: z.unknown().nullish(),
  errors: z.array(cloudflareErrorSchema).default([]),
  messages: z.array(z.unknown()).default([]),
});

const textGenerationResultSchema = z.object({
  response: z.unknown(),
  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    })
    .optional(),
});

@Injectable()
export class CloudflareWorkersAiProvider implements LlmProvider {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fastModel: string;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private readonly config: ConfigService) {
    this.accountId = config.get<string>('ai.cloudflare.accountId', '');
    this.apiToken = config.get<string>('ai.cloudflare.apiToken', '');
    this.baseUrl = config.get<string>(
      'ai.cloudflare.baseUrl',
      'https://api.cloudflare.com/client/v4',
    );
    this.model = config.get<string>(
      'ai.cloudflare.model',
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    );
    this.fastModel = config.get<string>(
      'ai.cloudflare.fastModel',
      '@cf/meta/llama-3.1-8b-instruct-fast',
    );
    this.timeoutMs = config.get<number>('ai.timeoutMs', 180000);
    this.maxTokens = config.get<number>('ai.cloudflare.maxTokens', 8192);
    this.temperature = config.get<number>('ai.cloudflare.temperature', 0.2);
  }

  async generateStructuredOutput<T>(input: LlmRequest, schema: JsonSchema): Promise<T> {
    if (!this.accountId) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID is required for the Cloudflare Workers AI provider.');
    }
    if (!this.apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN is required for the Cloudflare Workers AI provider.');
    }
    const selectedModel = input.inferenceProfile === 'FAST' ? this.fastModel : this.model;
    if (!/^@[a-z0-9-]+\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(selectedModel)) {
      throw new Error('CLOUDFLARE_AI_MODEL must be a valid hosted model identifier.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(
        `${this.baseUrl.replace(/\/$/, '')}/accounts/${encodeURIComponent(this.accountId)}/ai/run/${selectedModel}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `${input.systemPrompt}\nReturn only JSON that satisfies the supplied schema.`,
              },
              { role: 'user', content: this.userContent(input) },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: schema.schema,
            },
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            stream: false,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const rayId = this.safeReason(response.headers.get('cf-ray'));
        const providerCode = await this.readHttpErrorCode(response);
        throw new Error(
          `Cloudflare Workers AI request failed with HTTP ${response.status}${providerCode ? `, code ${providerCode}` : ''}${rayId ? ` (ray ${rayId})` : ''}.`,
        );
      }

      const envelope = responseEnvelopeSchema.parse(await response.json());
      if (!envelope.success) {
        const code = this.safeReason(envelope.errors[0]?.code);
        throw new Error(`Cloudflare Workers AI request failed${code ? ` (${code})` : ''}.`);
      }
      const result = textGenerationResultSchema.safeParse(envelope.result);
      if (!result.success) {
        throw new Error('Cloudflare Workers AI response did not contain structured output.');
      }
      return this.parseStructuredOutput<T>(result.data.response);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Cloudflare Workers AI request timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private userContent(input: LlmRequest): string {
    if (!input.context) return input.userPrompt;
    return `${input.userPrompt}\n\nStructured context:\n${JSON.stringify(input.context)}`;
  }

  private parseStructuredOutput<T>(value: unknown): T {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value as T;
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error('Cloudflare Workers AI response did not contain structured output.');
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new Error('Cloudflare Workers AI structured output was not valid JSON.');
    }
  }

  private safeReason(value?: string | number | null): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value);
    return /^[A-Za-z0-9_.-]{1,100}$/.test(text) ? text : undefined;
  }

  private async readHttpErrorCode(response: Response): Promise<string | undefined> {
    try {
      const payload: unknown = await response.json();
      const parsed = z
        .object({ errors: z.array(cloudflareErrorSchema).default([]) })
        .safeParse(payload);
      return parsed.success ? this.safeReason(parsed.data.errors[0]?.code) : undefined;
    } catch {
      return undefined;
    }
  }
}
