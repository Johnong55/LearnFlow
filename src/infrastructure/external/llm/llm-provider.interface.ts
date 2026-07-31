export interface JsonSchema {
  name: string;
  schema: Record<string, unknown>;
}

export interface LlmRequest {
  systemPrompt: string;
  userPrompt: string;
  context?: Record<string, unknown>;
  safetyIdentifier?: string;
  inferenceProfile?: 'FAST' | 'QUALITY';
}

export interface LlmProvider {
  generateStructuredOutput<T>(input: LlmRequest, schema: JsonSchema): Promise<T>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
