import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  provider: process.env.LLM_PROVIDER ?? 'mock',
  timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 60000),
}));
