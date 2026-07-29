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
});
