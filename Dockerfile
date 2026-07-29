# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma

FROM base AS development
RUN npm ci
COPY . .
RUN npx prisma generate
USER node
CMD ["npm", "run", "start:dev"]

FROM base AS dependencies
RUN npm ci

FROM dependencies AS build
COPY . .
RUN npx prisma generate && npm run build

FROM build AS migration
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "prisma:deploy"]

FROM build AS production-dependencies
RUN npm prune --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS production
ENV NODE_ENV=production \
  NODE_OPTIONS=--enable-source-maps \
  TZ=UTC
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && chown node:node /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/scripts/worker-healthcheck.cjs ./scripts/worker-healthcheck.cjs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
