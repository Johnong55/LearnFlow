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
    .valid('mock', 'openai', 'cloudflare-workers-ai', 'anthropic', 'gemini', 'local')
    .default('mock'),
  LLM_TIMEOUT_MS: Joi.number().integer().min(1000).max(300000).default(180000),
  OPENAI_API_KEY: Joi.when('LLM_PROVIDER', {
    is: 'openai',
    then: Joi.string().min(20).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  OPENAI_BASE_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .default('https://api.openai.com/v1'),
  OPENAI_MODEL: Joi.string().min(1).max(100).default('gpt-5.6-sol'),
  OPENAI_REASONING_EFFORT: Joi.string()
    .valid('none', 'low', 'medium', 'high', 'xhigh', 'max')
    .default('medium'),
  OPENAI_MAX_OUTPUT_TOKENS: Joi.number().integer().min(1000).max(128000).default(20000),
  OPENAI_PROJECT_ID: Joi.string().max(255).allow('').optional(),
  OPENAI_ORGANIZATION_ID: Joi.string().max(255).allow('').optional(),
  CLOUDFLARE_ACCOUNT_ID: Joi.when('LLM_PROVIDER', {
    is: 'cloudflare-workers-ai',
    then: Joi.string()
      .pattern(/^[a-fA-F0-9]{32}$/)
      .required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  CLOUDFLARE_API_TOKEN: Joi.when('LLM_PROVIDER', {
    is: 'cloudflare-workers-ai',
    then: Joi.string().min(20).max(512).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  CLOUDFLARE_AI_BASE_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .default('https://api.cloudflare.com/client/v4'),
  CLOUDFLARE_AI_MODEL: Joi.string()
    .pattern(/^@[a-z0-9-]+\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/)
    .default('@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
  CLOUDFLARE_AI_FAST_MODEL: Joi.string()
    .pattern(/^@[a-z0-9-]+\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/)
    .default('@cf/meta/llama-3.1-8b-instruct-fast'),
  CLOUDFLARE_AI_MAX_TOKENS: Joi.number().integer().min(256).max(24000).default(8192),
  CLOUDFLARE_AI_TEMPERATURE: Joi.number().min(0).max(5).default(0.2),
  GEMINI_API_KEY: Joi.when('LLM_PROVIDER', {
    is: 'gemini',
    then: Joi.string().min(20).max(512).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  GEMINI_BASE_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .default('https://generativelanguage.googleapis.com/v1beta'),
  GEMINI_MODEL: Joi.string()
    .pattern(/^[A-Za-z0-9._-]{1,100}$/)
    .default('gemini-2.5-flash'),
  GEMINI_FAST_MODEL: Joi.string()
    .pattern(/^[A-Za-z0-9._-]{1,100}$/)
    .default('gemini-2.5-flash-lite'),
  GEMINI_MAX_OUTPUT_TOKENS: Joi.number().integer().min(256).max(65536).default(32768),
  GEMINI_MAX_RETRIES: Joi.number().integer().min(0).max(6).default(3),
  GEMINI_RETRY_BASE_DELAY_MS: Joi.number().integer().min(100).max(10000).default(1000),
  GEMINI_RETRY_MAX_DELAY_MS: Joi.number().integer().min(1000).max(60000).default(15000),
  ROADMAP_PERSONALIZATION_TIMEOUT_MS: Joi.number().integer().min(60000).max(900000).default(900000),
  ROADMAP_LLM_CONCURRENCY: Joi.number().integer().min(1).max(5).default(2),
  SEARCH_PROVIDER: Joi.string()
    .valid('mock', 'google', 'bing', 'brave', 'tavily', 'serper')
    .default('mock'),
  SEARCH_MAX_RESULTS: Joi.number().integer().min(1).max(50).default(12),
  SEARCH_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(30000),
  SEARCH_QUERY_CONCURRENCY: Joi.number().integer().min(1).max(10).default(3),
  SEARCH_DOMAIN_ALLOWLIST: Joi.string().allow('').default(''),
  SEARCH_DOMAIN_BLOCKLIST: Joi.string().allow('').default(''),
  TAVILY_API_KEY: Joi.when('SEARCH_PROVIDER', {
    is: 'tavily',
    then: Joi.string().min(10).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  TAVILY_BASE_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .default('https://api.tavily.com'),
  TAVILY_SEARCH_DEPTH: Joi.string()
    .valid('basic', 'advanced', 'fast', 'ultra-fast')
    .default('basic'),
  TAVILY_PROJECT_ID: Joi.string().max(255).allow('').optional(),
  ROADMAP_JOB_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  ROADMAP_JOB_BACKOFF_MS: Joi.number().integer().min(100).max(60000).default(1000),
  SCHEDULE_JOB_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  SCHEDULE_JOB_BACKOFF_MS: Joi.number().integer().min(100).max(60000).default(1000),
  ADAPTIVE_SCHEDULE_CRON: Joi.string().default('0 2 * * *'),
});
