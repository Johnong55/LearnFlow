import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.LLM_PROVIDER ?? 'mock',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 180000),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL ?? 'gpt-5.6-sol',
    reasoningEffort: process.env.OPENAI_REASONING_EFFORT ?? 'medium',
    maxOutputTokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 20000),
    projectId: process.env.OPENAI_PROJECT_ID ?? '',
    organizationId: process.env.OPENAI_ORGANIZATION_ID ?? '',
  },
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN ?? '',
    baseUrl: process.env.CLOUDFLARE_AI_BASE_URL ?? 'https://api.cloudflare.com/client/v4',
    model: process.env.CLOUDFLARE_AI_MODEL ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    fastModel: process.env.CLOUDFLARE_AI_FAST_MODEL ?? '@cf/meta/llama-3.1-8b-instruct-fast',
    maxTokens: Number(process.env.CLOUDFLARE_AI_MAX_TOKENS ?? 8192),
    temperature: Number(process.env.CLOUDFLARE_AI_TEMPERATURE ?? 0.2),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    baseUrl: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    fastModel: process.env.GEMINI_FAST_MODEL ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
    maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 32768),
    maxRetries: Number(process.env.GEMINI_MAX_RETRIES ?? 3),
    retryBaseDelayMs: Number(process.env.GEMINI_RETRY_BASE_DELAY_MS ?? 1000),
    retryMaxDelayMs: Number(process.env.GEMINI_RETRY_MAX_DELAY_MS ?? 15000),
  },
}));
