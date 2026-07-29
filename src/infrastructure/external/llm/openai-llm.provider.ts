import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { JsonSchema, LlmProvider, LlmRequest } from './llm-provider.interface';

const responseEnvelopeSchema = z.object({
  status: z.string(),
  incomplete_details: z.object({ reason: z.string() }).nullish(),
  error: z.object({ code: z.string().nullish(), message: z.string().nullish() }).nullish(),
  output: z.array(z.unknown()).default([]),
  output_text: z.string().optional(),
});

const messageSchema = z.object({
  type: z.literal('message'),
  content: z.array(z.unknown()),
});

const outputTextSchema = z.object({
  type: z.literal('output_text'),
  text: z.string().min(1),
});

const refusalSchema = z.object({
  type: z.literal('refusal'),
  refusal: z.string().optional(),
});

type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

@Injectable()
export class OpenAiLlmProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly reasoningEffort: ReasoningEffort;
  private readonly projectId?: string;
  private readonly organizationId?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.get<string>('ai.openai.apiKey', '');
    this.baseUrl = config.get<string>('ai.openai.baseUrl', 'https://api.openai.com/v1');
    this.model = config.get<string>('ai.openai.model', 'gpt-5.6-sol');
    this.timeoutMs = config.get<number>('ai.timeoutMs', 60000);
    this.maxOutputTokens = config.get<number>('ai.openai.maxOutputTokens', 20000);
    this.reasoningEffort = config.get<ReasoningEffort>('ai.openai.reasoningEffort', 'medium');
    this.projectId = config.get<string>('ai.openai.projectId') || undefined;
    this.organizationId = config.get<string>('ai.openai.organizationId') || undefined;
  }

  async generateStructuredOutput<T>(input: LlmRequest, schema: JsonSchema): Promise<T> {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is required for the OpenAI provider.');
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(schema.name)) {
      throw new Error(
        'OpenAI JSON schema name must contain 1-64 letters, digits, underscores, or hyphens.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.projectId ? { 'OpenAI-Project': this.projectId } : {}),
          ...(this.organizationId ? { 'OpenAI-Organization': this.organizationId } : {}),
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            { role: 'system', content: input.systemPrompt },
            { role: 'user', content: this.userContent(input) },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: schema.name,
              schema: schema.schema,
              strict: true,
            },
          },
          reasoning: { effort: this.reasoningEffort },
          max_output_tokens: this.maxOutputTokens,
          store: false,
          ...(input.safetyIdentifier ? { safety_identifier: input.safetyIdentifier } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const requestId = this.safeReason(response.headers.get('x-request-id'));
        throw new Error(
          `OpenAI request failed with HTTP ${response.status}${requestId ? ` (request ${requestId})` : ''}.`,
        );
      }

      const payload = responseEnvelopeSchema.parse(await response.json());
      if (payload.status === 'incomplete') {
        const reason = this.safeReason(payload.incomplete_details?.reason);
        throw new Error(`OpenAI response was incomplete${reason ? ` (${reason})` : ''}.`);
      }
      if (payload.status !== 'completed') {
        const code = this.safeReason(payload.error?.code);
        throw new Error(`OpenAI response failed${code ? ` (${code})` : ''}.`);
      }

      const text = payload.output_text ?? this.extractOutputText(payload.output);
      if (!text) throw new Error('OpenAI response did not contain structured output.');
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error('OpenAI structured output was not valid JSON.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenAI request timed out after ${this.timeoutMs}ms.`);
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

  private extractOutputText(output: unknown[]): string | undefined {
    for (const candidate of output) {
      const message = messageSchema.safeParse(candidate);
      if (!message.success) continue;
      for (const content of message.data.content) {
        if (refusalSchema.safeParse(content).success) {
          throw new Error('OpenAI refused to generate the requested structured output.');
        }
        const outputText = outputTextSchema.safeParse(content);
        if (outputText.success) return outputText.data.text;
      }
    }
    return undefined;
  }

  private safeReason(value?: string | null): string | undefined {
    if (!value) return undefined;
    return /^[A-Za-z0-9_.-]{1,100}$/.test(value) ? value : undefined;
  }
}
