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
}));
