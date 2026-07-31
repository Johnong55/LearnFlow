# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:22-alpine AS production
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001
WORKDIR /app
RUN addgroup --system --gid 1001 skillpilot \
  && adduser --system --uid 1001 --ingroup skillpilot skillpilot
COPY --from=build --chown=skillpilot:skillpilot /app/public ./public
COPY --from=build --chown=skillpilot:skillpilot /app/.next/standalone ./
COPY --from=build --chown=skillpilot:skillpilot /app/.next/static ./.next/static
USER skillpilot
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3001/ || exit 1
CMD ["node", "server.js"]
