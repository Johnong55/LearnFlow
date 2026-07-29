import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.LLM_PROVIDER ?? 'mock',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 60000),
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
    maxTokens: Number(process.env.CLOUDFLARE_AI_MAX_TOKENS ?? 8192),
    temperature: Number(process.env.CLOUDFLARE_AI_TEMPERATURE ?? 0.2),
  },
}));
