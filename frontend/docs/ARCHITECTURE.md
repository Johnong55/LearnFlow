# Frontend architecture

## Route map

Phase 1–2 routes are implemented now:

```text
/
├── sign-in
├── sign-up
├── forgot-password
├── reset-password
├── privacy
├── terms
└── dev/design-system
```

Reserved for the following phases:

```text
/onboarding/{welcome,about-you,work,sleep,routines,energy,skills,goal,preferences,review,generating}
/app
├── today
├── roadmap
│   ├── milestones/[milestoneId]
│   ├── modules/[moduleId]
│   └── tasks/[taskId]
├── calendar
├── goals/{new,[goalId]}
├── progress
├── routines
├── resources
└── settings
```

## Component hierarchy

```text
RootLayout
└── AppProviders
    ├── ThemeProvider
    ├── QueryClientProvider
    ├── AuthSessionListener
    ├── PageTransition
    │   ├── MarketingLayout → Header → Landing sections → Footer
    │   └── AuthLayout → AuthShell → typed feature form
    └── Sonner Toaster
```

Marketing sections, form controls, motion wrappers, feedback, and layout components are separate boundaries. Route files mainly compose these pieces and provide metadata.

## Design tokens

Semantic CSS variables are the source of truth: background, foreground, surface, muted surface, primary, accent, coral, info, border, ring, success, warning, and danger. Light and dark themes swap semantic values rather than component classes. Tailwind v4 maps those variables through `@theme inline`.

Cards use 20–32px radii, buttons use 14–20px radii, and interactions preserve visible focus states and 44px minimum targets. No component depends on raw status color alone; icons and labels accompany state.

## Typography

Inter is registered with `next/font/google`, includes Vietnamese, and becomes `--font-body`. The display variable retains the Gliker Expanded integration point with a safe rounded fallback. Licensed Gliker files are never downloaded or fabricated.

## Motion

Durations, easing curves, springs, and reusable variants live in `src/lib/motion/tokens.ts`. Route and component motion use transform and opacity. All major motion reads `useReducedMotion`, while global CSS collapses non-essential animation for `prefers-reduced-motion`.

## API and authentication

Axios is centralized in `src/lib/api/client.ts`. It supplies a 12-second timeout, credentials, bearer attachment, one safe network retry, single-flight refresh, cancellation support, and normalized errors. Domain files unwrap the backend's standard response envelope. Access tokens stay in memory; refresh tokens remain in backend-managed HTTP-only cookies.

## Responsive strategy

The implementation is mobile-first from 320px. The marketing header becomes a focus-trapped drawer, auth preview artwork is hidden below desktop, grids collapse without horizontal overflow, and controls retain touch-friendly dimensions. Tablet and desktop progressively introduce richer layouts without stretching readable content beyond the shared shell.

## Implementation sequence

1. Repository and strict tooling boundaries.
2. Semantic tokens, fonts, providers, and motion.
3. Typed UI primitives and feedback states.
4. API/authentication foundation.
5. Landing page and interactive product preview.
6. Authentication flows and development design system.
7. Unit, component, end-to-end, audit, and production-build verification.
