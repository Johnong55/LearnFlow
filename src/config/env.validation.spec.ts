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
});
