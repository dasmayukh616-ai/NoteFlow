# Frontend Parity Rules

## Scope Freeze
- The current Next.js frontend is the behavior baseline for parity.
- During parity rewrite, do not add net-new product features to the legacy frontend.
- Legacy frontend changes are limited to bug fixes, security fixes, and parity adapter work.

## Migration Rule
- Backend source of truth remains the existing Convex + Next.js backend until parity completion.
- Frontend rewrite work must not change backend authorization semantics.
- Parity clients consume stable compatibility endpoints and shared DTOs, not React/Convex hooks.

## Compatibility API Rule
- Use a versioned surface under `/api/v1/*` as the parity bridge.
- Normalize responses into a consistent result envelope (`ok` + `data` or `error`).
- Keep endpoint names and response contracts stable during the parity phase.
- Any backend internals can evolve behind the `/api/v1/*` adapter boundary.

## Completion Rule
- Frontend/backend decoupling changes happen only after parity gates are met on web and desktop.
- Old frontend removal is allowed only after parity checklist, visual checks, and P0 journey checks pass.

## Freeze Enforcement
- The repository includes an automated guard script: `npm run freeze:check`.
- CI runs this guard on pull requests in `.github/workflows/next-freeze-guard.yml`.
- By default, legacy Next.js frontend surface changes are blocked during parity freeze.
- Explicitly allowed paths during freeze:
- `src/app/api/v1/**/route.ts`
- `src/lib/parity-api/*.ts`
- `src/lib/parity-api/README.md`
- Emergency exceptions are allowed only with both environment variables:
- `NEXT_FREEZE_BYPASS=1`
- `NEXT_FREEZE_BYPASS_REASON="<short reason>"`
