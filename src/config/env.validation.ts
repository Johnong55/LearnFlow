import * as Joi from 'joi';

const developmentSecret = 'development-only-secret-change-before-production';

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  APP_NAME: Joi.string().default('LearnFlow API'),
  APP_HOST: Joi.string().default('0.0.0.0'),
  APP_PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),
  TRUST_PROXY: Joi.boolean().truthy('true').falsy('false').default(false),
  REQUEST_BODY_LIMIT: Joi.string().default('1mb'),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').optional(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),
  JWT_ACCESS_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(32).default(developmentSecret),
  }),
  JWT_REFRESH_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required().invalid(Joi.ref('JWT_ACCESS_SECRET')),
    otherwise: Joi.string().min(32).default(`${developmentSecret}-refresh`),
  }),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  JWT_REFRESH_EXPIRES_DAYS: Joi.number().integer().min(1).max(365).default(30),
  PASSWORD_RESET_EXPIRES_MINUTES: Joi.number().integer().min(5).max(1440).default(30),
  ARGON2_MEMORY_COST: Joi.number().integer().min(8192).default(19456),
  ARGON2_TIME_COST: Joi.number().integer().min(2).default(2),
  ARGON2_PARALLELISM: Joi.number().integer().min(1).default(1),
  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  COOKIE_DOMAIN: Joi.string().optional().allow(''),
  RATE_LIMIT_TTL_MS: Joi.number().integer().min(1000).default(60000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(100),
  LOG_LEVEL: Joi.string().valid('debug', 'log', 'warn', 'error').default('log'),
  LLM_PROVIDER: Joi.string()
    .valid('mock', 'openai', 'anthropic', 'gemini', 'local')
    .default('mock'),
  LLM_TIMEOUT_MS: Joi.number().integer().min(1000).max(300000).default(60000),
  SEARCH_PROVIDER: Joi.string()
    .valid('mock', 'google', 'bing', 'brave', 'tavily', 'serper')
    .default('mock'),
  SEARCH_MAX_RESULTS: Joi.number().integer().min(1).max(50).default(12),
  SEARCH_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(30000),
  SEARCH_DOMAIN_ALLOWLIST: Joi.string().allow('').default(''),
  SEARCH_DOMAIN_BLOCKLIST: Joi.string().allow('').default(''),
  ROADMAP_JOB_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  ROADMAP_JOB_BACKOFF_MS: Joi.number().integer().min(100).max(60000).default(1000),
  SCHEDULE_JOB_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  SCHEDULE_JOB_BACKOFF_MS: Joi.number().integer().min(100).max(60000).default(1000),
  ADAPTIVE_SCHEDULE_CRON: Joi.string().default('0 2 * * *'),
});
