import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { JsonSchema, LlmProvider, LlmRequest } from './llm-provider.interface';

const geminiErrorSchema = z.object({
  error: z
    .object({
      code: z.union([z.string(), z.number()]).optional(),
      status: z.string().optional(),
    })
    .optional(),
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.string().optional(),
        content: z
          .object({
            parts: z.array(z.object({ text: z.string().optional() }).passthrough()).default([]),
          })
          .optional(),
      }),
    )
    .default([]),
  promptFeedback: z.object({ blockReason: z.string().optional() }).optional(),
});

const supportedSchemaKeys = new Set([
  '$id',
  '$defs',
  '$ref',
  '$anchor',
  'type',
  'title',
  'description',
  'enum',
  'items',
  'prefixItems',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
  'propertyOrdering',
]);

@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiLlmProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fastModel: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly retryMaxDelayMs: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('ai.gemini.apiKey', '');
    this.baseUrl = config.get<string>(
      'ai.gemini.baseUrl',
      'https://generativelanguage.googleapis.com/v1beta',
    );
    this.model = config.get<string>('ai.gemini.model', 'gemini-2.5-flash');
    this.fastModel = config.get<string>('ai.gemini.fastModel', this.model);
    this.timeoutMs = config.get<number>('ai.timeoutMs', 180000);
    this.maxOutputTokens = config.get<number>('ai.gemini.maxOutputTokens', 32768);
    this.maxRetries = config.get<number>('ai.gemini.maxRetries', 3);
    this.retryBaseDelayMs = config.get<number>('ai.gemini.retryBaseDelayMs', 1000);
    this.retryMaxDelayMs = config.get<number>('ai.gemini.retryMaxDelayMs', 15000);
  }

  async generateStructuredOutput<T>(input: LlmRequest, schema: JsonSchema): Promise<T> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is required for the Gemini provider.');
    const model = input.inferenceProfile === 'FAST' ? this.fastModel : this.model;
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(model)) {
      throw new Error('GEMINI_MODEL must be a valid hosted model identifier.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: `${input.systemPrompt}\nReturn only JSON that satisfies the supplied schema.`,
                },
              ],
            },
            contents: [{ role: 'user', parts: [{ text: this.userContent(input) }] }],
            generationConfig: {
              maxOutputTokens: this.maxOutputTokens,
              responseMimeType: 'application/json',
              responseJsonSchema: this.normalizeSchema(schema.schema),
            },
          }),
          signal: controller.signal,
        },
        controller.signal,
      );

      if (!response.ok) {
        const reason = await this.readHttpErrorReason(response);
        throw new Error(
          `Gemini request failed with HTTP ${response.status}${reason ? ` (${reason})` : ''}.`,
        );
      }

      const payload = geminiResponseSchema.parse(await response.json());
      const blockReason = this.safeReason(payload.promptFeedback?.blockReason);
      if (blockReason) throw new Error(`Gemini blocked the request (${blockReason}).`);

      const candidate = payload.candidates[0];
      const text = candidate?.content?.parts
        .map((part) => part.text ?? '')
        .join('')
        .trim();
      if (!text) {
        const finishReason = this.safeReason(candidate?.finishReason);
        throw new Error(
          `Gemini response did not contain structured output${finishReason ? ` (${finishReason})` : ''}.`,
        );
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error('Gemini structured output was not valid JSON.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${this.timeoutMs}ms.`);
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

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    signal: AbortSignal,
  ): Promise<Response> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (!this.isRetryableStatus(response.status) || attempt >= this.maxRetries) {
          return response;
        }
        const delayMs = this.retryDelayMs(response, attempt);
        this.logger.warn(
          `Gemini returned transient HTTP ${response.status}; retry ${attempt + 1}/${this.maxRetries} in ${delayMs}ms`,
        );
        await response.body?.cancel();
        await this.waitForRetry(delayMs, signal);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        if (attempt >= this.maxRetries) throw error;
        const delayMs = this.exponentialDelayMs(attempt);
        this.logger.warn(
          `Gemini request encountered a transient network error; retry ${attempt + 1}/${this.maxRetries} in ${delayMs}ms`,
        );
        await this.waitForRetry(delayMs, signal);
      }
    }
  }

  private isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status >= 500;
  }

  private retryDelayMs(response: Response, attempt: number): number {
    const retryAfter = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
      return Math.min(this.retryMaxDelayMs, Math.round(retryAfterSeconds * 1000));
    }
    return this.exponentialDelayMs(attempt);
  }

  private exponentialDelayMs(attempt: number): number {
    const base = Math.min(this.retryMaxDelayMs, this.retryBaseDelayMs * 2 ** attempt);
    const jitter = Math.floor(Math.random() * Math.min(500, base * 0.2));
    return Math.min(this.retryMaxDelayMs, base + jitter);
  }

  private waitForRetry(delayMs: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, delayMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  private normalizeSchema(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.normalizeSchema(item));
    if (!value || typeof value !== 'object') return value;
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (!supportedSchemaKeys.has(key)) continue;
      if (key === 'enum' && Array.isArray(child)) {
        const enumValues: unknown[] = child;
        const enumCharacters = enumValues.reduce<number>(
          (total, item) => total + String(item).length,
          0,
        );
        if (enumValues.length > 10 || enumCharacters > 256) continue;
      }
      if (key === 'properties' || key === '$defs') {
        output[key] = Object.fromEntries(
          Object.entries(child as Record<string, unknown>).map(([name, property]) => [
            name,
            this.normalizeSchema(property),
          ]),
        );
      } else {
        output[key] = this.normalizeSchema(child);
      }
    }
    return output;
  }

  private async readHttpErrorReason(response: Response): Promise<string | undefined> {
    try {
      const parsed = geminiErrorSchema.safeParse(await response.json());
      if (!parsed.success) return undefined;
      return this.safeReason(parsed.data.error?.status) ?? this.safeReason(parsed.data.error?.code);
    } catch {
      return undefined;
    }
  }

  private safeReason(value?: string | number | null): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value);
    return /^[A-Za-z0-9_.-]{1,100}$/.test(text) ? text : undefined;
  }
}
