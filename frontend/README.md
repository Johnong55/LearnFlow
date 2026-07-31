# SkillPilot frontend

Production-oriented Next.js frontend for the LearnFlow backend. The temporary product brand is **SkillPilot**.

## Requirements

- Node.js 22+
- npm 10+
- LearnFlow API running on port `3000`

## Local setup

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3001`. Swagger for the local backend remains at `http://localhost:3000/docs`.

## Environment

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Only public, browser-safe values may use the `NEXT_PUBLIC_` prefix. Never put an API secret, JWT secret, refresh token, or provider key in frontend environment files.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run start
npm run format:check
```

Install the Playwright browser once before the first end-to-end run:

```bash
npx playwright install chromium
```

## Production container

The repository production Compose file builds the standalone, non-root frontend
container automatically. Browser API calls use the same-origin `/api/v1` path;
Nginx routes that path to NestJS and routes `/` to Next.js.

## Authentication model

- The access token is held in module memory only.
- The rotating refresh token is handled by the backend's secure HTTP-only cookie.
- Requests include credentials and attach the access token when present.
- Concurrent `401` responses share one refresh request.
- A failed refresh clears the in-memory session and emits one session-expired event.
- Only safe `GET` requests receive a single network retry.
- Raw Axios errors are normalized centrally before they reach a component.

For local cookie refresh, the backend CORS configuration must include `http://localhost:3001` and enable credentials. The existing backend defaults already do this.

## Fonts

Inter is loaded through `next/font/google` with Vietnamese support. Gliker Expanded is a licensed font and is intentionally not included. Until its WOFF2 files are supplied, the display system uses:

```css
"Gliker Expanded", "Arial Rounded MT Bold", Arial, sans-serif
```

See `public/fonts/README.md` for the exact file names and integration step.

## Implemented routes

- `/` — complete responsive marketing page
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password?token=...`
- `/privacy`
- `/terms`
- `/dev/design-system` — development only
- `/robots.txt`
- `/sitemap.xml`

## Project boundaries

Server state belongs in TanStack Query, form state in React Hook Form, and small cross-page UI preferences in Zustand. Server data and tokens are not persisted in the UI store. More detail is available in `docs/ARCHITECTURE.md`.
