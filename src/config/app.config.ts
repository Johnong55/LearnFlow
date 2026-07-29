import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  return {
    nodeEnv,
    name: process.env.APP_NAME ?? 'LearnFlow API',
    host: process.env.APP_HOST ?? '0.0.0.0',
    port: Number(process.env.APP_PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
      .split(',')
      .map((value) => value.trim()),
    trustProxy: process.env.TRUST_PROXY === 'true',
    bodyLimit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
    swaggerEnabled:
      process.env.SWAGGER_ENABLED === undefined
        ? nodeEnv !== 'production'
        : process.env.SWAGGER_ENABLED === 'true',
  };
});
