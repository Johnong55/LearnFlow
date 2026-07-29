'use strict';

const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

async function main() {
  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });
  try {
    await redis.connect();
    await Promise.all([prisma.$queryRawUnsafe('SELECT 1'), redis.ping()]);
  } finally {
    await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  }
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Worker health check failed'}\n`,
  );
  process.exitCode = 1;
});
