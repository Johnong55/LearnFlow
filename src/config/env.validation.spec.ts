import { environmentSchema } from './env.validation';

describe('environment validation', () => {
  const base = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379/0',
  };

  it('rejects production configuration without secrets', () => {
    const result = environmentSchema.validate({ ...base, NODE_ENV: 'production' });
    expect(result.error).toBeDefined();
  });

  it('accepts safe development defaults', () => {
    const result = environmentSchema.validate({ ...base, NODE_ENV: 'test' });
    expect(result.error).toBeUndefined();
  });

  it('requires an API key when Tavily is selected', () => {
    const missing = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      SEARCH_PROVIDER: 'tavily',
    });
    const configured = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      SEARCH_PROVIDER: 'tavily',
      TAVILY_API_KEY: 'tvly-valid-test-key',
    });

    expect(missing.error).toBeDefined();
    expect(configured.error).toBeUndefined();
  });

  it('requires an API key when OpenAI is selected', () => {
    const missing = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      LLM_PROVIDER: 'openai',
    });
    const configured = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-valid-openai-test-key',
    });

    expect(missing.error).toBeDefined();
    expect(configured.error).toBeUndefined();
  });

  it('requires an account ID and API token when Cloudflare Workers AI is selected', () => {
    const missing = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      LLM_PROVIDER: 'cloudflare-workers-ai',
    });
    const configured = environmentSchema.validate({
      ...base,
      NODE_ENV: 'test',
      LLM_PROVIDER: 'cloudflare-workers-ai',
      CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
      CLOUDFLARE_API_TOKEN: 'cloudflare-valid-test-api-token',
    });

    expect(missing.error).toBeDefined();
    expect(configured.error).toBeUndefined();
  });
});
