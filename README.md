# LearnFlow Backend

[![CI](https://github.com/Johnong55/LearnFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Johnong55/LearnFlow/actions/workflows/ci.yml)

Production-oriented Phase 1–6 backend for an AI-powered learning roadmap and life scheduling service. It is a strict-TypeScript modular NestJS application backed by PostgreSQL/Prisma and Redis/BullMQ.

## Phase 1 architecture

```text
HTTP client
  -> NestJS bootstrap (Helmet, CORS, body limits, Swagger)
  -> request ID middleware
  -> rate-limit, JWT, and RBAC guards
  -> Auth / Users / Health controllers
  -> application services
  -> repository adapters
  -> Prisma -> PostgreSQL
  -> BullMQ / cache -> Redis

Separate worker bootstrap -> BullMQ processors -> shared repositories
```

The API and worker are separate processes from the same codebase. Business modules contain controllers, services, repositories, DTOs, interfaces, and tests. Infrastructure owns database, cache, queue, and audit integrations. Cross-cutting HTTP behavior lives in `src/common`.

## Project structure

```text
src/
├── main.ts                     # HTTP process bootstrap
├── worker.ts                   # Worker process bootstrap
├── app.module.ts
├── worker.module.ts
├── config/                     # Typed configuration factories and validation
├── common/                     # Decorators, guards, filters, middleware, interceptors
├── infrastructure/
│   ├── cache/                  # Redis client
│   ├── database/               # Prisma lifecycle
│   ├── logging/                # Durable audit service
│   ├── queue/                  # BullMQ setup
│   └── external/               # Provider-neutral search and LLM adapters
├── modules/
│   ├── auth/                   # Registration, login, token lifecycle, password reset
│   ├── users/                  # Current-user profile lifecycle
│   ├── onboarding/             # Validated, resumable onboarding drafts
│   ├── routines/               # Recurring life activities and overlap rules
│   ├── availability/           # Available, unavailable, and preferred periods
│   ├── skills/                 # Global skill catalog and user skill state
│   ├── goals/                  # Owned learning goals and state transitions
│   ├── roadmap-jobs/           # Generation enqueue, progress, and retry API
│   ├── roadmaps/               # Versioned roadmaps and source attribution
│   ├── calendar/               # Fixed events and unified calendar views
│   ├── scheduling/             # Deterministic planning, persistence, and adaptation
│   ├── sessions/               # Study/task lifecycle and feedback
│   ├── progress/               # Analytics, streaks, pace, and snapshots
│   └── notifications/          # Owned in-app scheduling alerts
├── health/                     # Liveness and readiness endpoints
└── workers/                    # BullMQ worker host
prisma/
├── schema.prisma
└── migrations/
test/                           # End-to-end test foundation
```

## Database entities

- `User`: credentials, role, verification/onboarding state, login and soft-delete timestamps.
- `UserProfile`: name, timezone, locale, birth date, and employment profile.
- `UserPreference`: learning/session preferences and notification settings.
- `RefreshToken`: SHA-256 token digest, rotation family, expiry, revocation, and client metadata.
- `PasswordResetToken` and `EmailVerificationToken`: hashed, expiring, one-time credentials.
- `BackgroundJob`: durable queue status, progress, retry/error data, and idempotency key.
- `AuditLog`: security and business action trail with request/client metadata.
- `OnboardingProgress`: four validated draft steps and completion state.
- `Routine` and `AvailabilityRule`: recurring local-time life constraints.
- `Skill` and `UserSkill`: normalized skill catalog, levels, confidence, and targets.
- `LearningGoal`: target outcome, deadline, capacity, priority, criteria, and constraints.
- `Roadmap` and `RoadmapVersion`: stable identity with immutable generated versions.
- `RoadmapMilestone`, `RoadmapModule`, `LearningTask`, and `TaskDependency`: ordered learning hierarchy.
- `RoadmapSource` and `RoadmapModuleSource`: ranked source metadata and per-module attribution.
- `CalendarEvent`: owned fixed/flexible UTC calendar blocks.
- `StudySession`: generated task sessions with planned duration and lifecycle-ready status.
- `SchedulingConflict`: unresolved and historical reasons that tasks could not be placed.
- `SessionFeedback`: optional per-session or task-level focus, difficulty, duration, and notes.
- `ProgressSnapshot`: idempotent daily progress, adherence, streak, and completion estimates.
- `Notification`: owned in-app schedule-change and deadline-risk alerts.

All timestamps are stored as PostgreSQL `TIMESTAMPTZ` values and handled as UTC by the application.

## API endpoints

All business endpoints are under `/api/v1`.

| Method           | Path                          | Authentication | Purpose                                                        |
| ---------------- | ----------------------------- | -------------: | -------------------------------------------------------------- |
| POST             | `/auth/register`              |         Public | Register and receive tokens                                    |
| POST             | `/auth/login`                 |         Public | Sign in and receive tokens                                     |
| POST             | `/auth/refresh`               |         Public | Rotate a refresh token                                         |
| POST             | `/auth/logout`                |         Bearer | Revoke a refresh token                                         |
| POST             | `/auth/forgot-password`       |         Public | Create a reset request without account disclosure              |
| POST             | `/auth/reset-password`        |         Public | Consume a one-time reset token                                 |
| GET              | `/auth/me`                    |         Bearer | Read authenticated identity                                    |
| GET              | `/users/me`                   |         Bearer | Read profile and preferences                                   |
| PATCH            | `/users/me`                   |         Bearer | Update profile and preferences                                 |
| DELETE           | `/users/me`                   |         Bearer | Soft-delete account and revoke sessions                        |
| GET/PUT          | `/onboarding/*`               |         Bearer | Read and save resumable onboarding steps                       |
| POST             | `/onboarding/complete`        |         Bearer | Validate, materialize routines/skills, and complete onboarding |
| GET/POST         | `/skills`                     |         Bearer | List and create current-user skills                            |
| GET/PATCH/DELETE | `/skills/:id`                 |         Bearer | Read, update, or soft-delete an owned skill                    |
| GET/POST         | `/goals`                      |         Bearer | List/filter and create learning goals                          |
| GET/PATCH/DELETE | `/goals/:id`                  |         Bearer | Read, update, or soft-delete an owned goal                     |
| POST             | `/goals/:id/pause`            |         Bearer | Pause an active/analyzing goal                                 |
| POST             | `/goals/:id/resume`           |         Bearer | Resume a paused goal                                           |
| GET/POST         | `/routines`                   |         Bearer | List and create recurring routines                             |
| PATCH/DELETE     | `/routines/:id`               |         Bearer | Update or soft-delete an owned routine                         |
| GET/POST         | `/availability-rules`         |         Bearer | List and create availability rules                             |
| PATCH/DELETE     | `/availability-rules/:id`     |         Bearer | Update or soft-delete an owned availability rule               |
| POST             | `/goals/:id/generate-roadmap` |         Bearer | Queue asynchronous roadmap generation                          |
| GET              | `/roadmap-jobs/:jobId`        |         Bearer | Read generation stage, progress, result, or error              |
| POST             | `/roadmap-jobs/:jobId/retry`  |         Bearer | Retry a failed generation job                                  |
| GET              | `/roadmaps`                   |         Bearer | List owned roadmaps and latest versions                        |
| GET/PATCH        | `/roadmaps/:id`               |         Bearer | Read a selected version or update metadata                     |
| POST             | `/roadmaps/:id/activate`      |         Bearer | Activate the latest version                                    |
| POST             | `/roadmaps/:id/regenerate`    |         Bearer | Queue a new immutable version                                  |
| POST             | `/roadmaps/:id/archive`       |         Bearer | Archive a roadmap                                              |
| GET              | `/roadmaps/:id/sources`       |         Bearer | Read ranked sources for a version                              |
| GET              | `/roadmaps/:id/progress`      |         Bearer | Read deterministic task completion summary                     |
| GET              | `/calendar`                   |         Bearer | List events and study sessions in a UTC range                  |
| GET              | `/calendar/day`               |         Bearer | Read one day in the user's timezone                            |
| GET              | `/calendar/week`              |         Bearer | Read seven days in the user's timezone                         |
| POST             | `/calendar/events`            |         Bearer | Create a fixed or flexible event                               |
| PATCH/DELETE     | `/calendar/events/:id`        |         Bearer | Update or soft-delete an owned event                           |
| POST             | `/schedules/preview`          |         Bearer | Calculate a schedule without persistence                       |
| POST             | `/schedules/generate`         |         Bearer | Queue deterministic schedule persistence                       |
| POST             | `/schedules/rebalance`        |         Bearer | Queue schedule recalculation                                   |
| GET              | `/schedules/conflicts`        |         Bearer | List unresolved placement conflicts                            |
| GET              | `/schedules/jobs/:jobId`      |         Bearer | Read schedule worker progress and result                       |
| POST             | `/sessions/:id/start`         |         Bearer | Start or resume a study session                                |
| POST             | `/sessions/:id/pause`         |         Bearer | Pause an in-progress study session                             |
| POST             | `/sessions/:id/complete`      |         Bearer | Complete a session and record actual duration/feedback         |
| POST             | `/sessions/:id/skip`          |         Bearer | Skip a session and queue adaptive rebalancing                  |
| POST             | `/tasks/:id/complete`         |         Bearer | Manually complete a learning task                              |
| POST             | `/tasks/:id/feedback`         |         Bearer | Record difficulty, focus, duration, and notes                  |
| GET              | `/progress/overview`          |         Bearer | Read aggregate and per-goal progress                           |
| GET              | `/progress/weekly`            |         Bearer | Read seven-day consistency and adherence                       |
| GET              | `/progress/goals/:goalId`     |         Bearer | Read detailed goal pace and estimated completion               |
| GET              | `/notifications`              |         Bearer | List owned in-app notifications                                |
| POST             | `/notifications/:id/read`     |         Bearer | Mark a notification as read                                    |

Operational endpoints are `/health`, `/health/live`, and `/health/ready`. Swagger UI is at `/docs`.
Swagger is enabled by default outside production and disabled by default in production.

## Environment

Copy the example and replace every `replace-*` or `change-*` value:

```bash
cp .env.example .env
openssl rand -base64 48
```

Required in production: `DATABASE_URL`, `REDIS_URL`, and distinct 32+ character `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values. See `.env.example` for application, cookie, Argon2, rate-limit, and Docker PostgreSQL variables.

Local development defaults to deterministic `SEARCH_PROVIDER=mock` and
`LLM_PROVIDER=mock`. Tavily is available as the first hosted search adapter;
other unsupported provider names fail during startup rather than silently
falling back.

To enable Tavily, create an API key in its dashboard and update the environment:

```dotenv
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=replace-with-your-tavily-key
TAVILY_SEARCH_DEPTH=basic
```

`basic` is the cost-conscious default. The adapter requests only ranked snippets
and metadata, never raw page content, passes the configured source allowlist and
blocklist to Tavily, and enforces the same domain policy again after receiving a
response. Optional variables are documented in `.env.example`.

## Local development

Prerequisites: Node.js 22+, npm 10+, PostgreSQL 15+, and Redis 7+.

```bash
npm ci
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate -- --name phase_1
npm run start:dev
```

Start the worker in another terminal:

```bash
npm run start:worker:dev
```

## Docker development

```bash
cp .env.example .env
docker compose up --build
docker compose ps
docker compose logs -f api worker
```

The development compose file exposes the API on port 3000. PostgreSQL and Redis bind only to loopback for host development and are not remotely accessible.

To stop containers without deleting database data:

```bash
docker compose down
```

## Production deployment

Phase 6 provides a multi-stage, non-root image; isolated PostgreSQL and Redis;
separate API, worker, and migration containers; Nginx TLS termination; Certbot;
health checks; resource limits; log rotation; and backup/restore automation.

Use the complete [VPS deployment runbook](docs/deployment.md). Validate production
configuration locally before a release:

```bash
cp .env.production.example .env.production
# Replace every example domain, password, and secret first.
./scripts/validate-production.sh .env.production
```

## Prisma commands

```bash
npm run prisma:generate
npm run prisma:migrate -- --name descriptive_name
npm run prisma:deploy
npm run prisma:studio
```

`prisma migrate dev` is for local development. Deploy checked-in migrations with `prisma migrate deploy` in release environments.

## Verification

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run test:cov
npm run build
```

## Example requests

Register:

```bash
curl -sS http://localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"learner@example.com","password":"Correct-Horse-Battery-42","fullName":"Ada Lovelace"}'
```

Log in and save the HttpOnly refresh cookie:

```bash
curl -sS -c cookies.txt http://localhost:3000/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"learner@example.com","password":"Correct-Horse-Battery-42"}'
```

Use the returned access token:

```bash
curl -sS http://localhost:3000/api/v1/users/me \
  -H 'authorization: Bearer REPLACE_WITH_ACCESS_TOKEN'
```

Rotate via the cookie:

```bash
curl -sS -b cookies.txt -c cookies.txt -X POST \
  http://localhost:3000/api/v1/auth/refresh \
  -H 'content-type: application/json' -d '{}'
```

Check dependencies:

```bash
curl -sS http://localhost:3000/health/ready
```

Preview a schedule without saving it:

```bash
curl -sS -X POST http://localhost:3000/api/v1/schedules/preview \
  -H 'authorization: Bearer REPLACE_WITH_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{"roadmapId":"REPLACE_WITH_ROADMAP_ID","from":"2026-07-30","to":"2026-08-26","mode":"BALANCED","minimumSessionMinutes":25,"breakMinutes":10}'
```

Persist the same plan asynchronously by changing the path to `/schedules/generate`, then poll `/schedules/jobs/:jobId`. The API and worker processes must both be running.

Complete a study session with measured duration and feedback:

```bash
curl -sS -X POST http://localhost:3000/api/v1/sessions/REPLACE_WITH_SESSION_ID/complete \
  -H 'authorization: Bearer REPLACE_WITH_ACCESS_TOKEN' \
  -H 'content-type: application/json' \
  -d '{"actualMinutes":45,"difficultyRating":3,"focusLevel":4,"notes":"Completed the exercise"}'
```

The session must first be started through `/sessions/:id/start`. A paused session can be resumed through the same start endpoint.

## Security notes

- Passwords use Argon2id. Raw refresh/reset tokens are never persisted.
- Refresh tokens rotate on use. Reuse of a revoked token revokes its entire family.
- The access token belongs in the `Authorization` header. The refresh token is also issued as an HttpOnly, SameSite=Strict cookie.
- Production startup rejects missing, short, or identical JWT secrets.
- Prisma parameterizes database queries. Validation strips no unknown data silently: unknown fields are rejected.
- Account existence is not disclosed by forgot-password responses.

## Known limitations

- Password reset token creation and consumption are implemented, but outbound email delivery is intentionally not wired until the notification/email integration phase. In production, connect the reset issuance path to a transactional email worker before enabling this route publicly.
- Email verification has persistence structure but no endpoint or mail delivery because verification workflow was requested as structure only in Phase 1.
- Search uses snippets and metadata only. The mock provider never scrapes third-party pages.
- Tavily search is supported through a provider-neutral adapter. Other hosted search providers and hosted LLM adapters are not bundled yet.
- Scheduling uses deterministic hard constraints and preference scoring. Calendar-provider synchronization and richer energy-profile windows are not connected yet.
- Adaptive scheduling is deterministic and runs daily using `ADAPTIVE_SCHEDULE_CRON`. BullMQ marks expired sessions missed, compares remaining task minutes with future planned minutes, queues only required replacements, writes an idempotent progress snapshot, and creates in-app alerts.
- Notifications are persisted and readable through REST, but outbound push/email delivery is not connected yet.
- Integration and e2e tests that exercise PostgreSQL/Redis require those services. Unit tests do not.
- The Phase 6 deployment targets a single VPS. It does not provide zero-downtime multi-host orchestration, managed database failover, or built-in metrics export.

## Recommended next task

Deploy a staging instance, exercise the restore and rollback runbooks, then implement the first real LLM adapter behind the existing provider interface.
