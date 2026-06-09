# Rust Rewrite Source-Of-Truth Plan

## Summary
- Supersede `RUST FRONTEND PLAN.md` as written: this is now a **full Rust product rewrite**, not only a Leptos parity frontend.
- Target stack: **Leptos web + Tauri desktop + Axum Rust API + Postgres**.
- Keep the current Next app runnable as the **visual/behavior reference only**; stop Next feature work except parity adapters or critical fixes.
- First milestone is **shell parity**: landing/auth/dashboard shell/sidebar/page list, matching the current Next UI.
- Do **not** build a custom database engine now; Postgres is the product database.

## Current Status - 2026-05-29
- Done: Visual C++/Windows SDK tooling is installed and `cargo check --workspace` passes.
- Done: Axum API, SQLx migrations, Postgres schema, auth endpoints, workspace/page endpoints, shared Rust client/types, Leptos shell, and Tauri shell are implemented.
- Done: API behavior is covered by a real Postgres integration test for register, login, me, logout, workspace filtering, and page filtering.
- Done: Leptos shell was verified in the browser against `http://127.0.0.1:3317`; register, dashboard refresh, and API sync work.
- Done: Tauri desktop was launched against the same Leptos UI and verified through its WebView; desktop register and API sync work.
- Done: `npm run freeze:check` passes with the current legacy Next surface captured in a hash-pinned baseline.
- Done: Page CRUD is implemented on the Rust API/client and covered by Postgres integration tests.
- Done: Native Leptos editor MVP is implemented with create/open, editable title/body, debounced autosave, minimal ProseMirror-compatible JSON storage, and rich-content read-only preservation.
- Done: Editor MVP was verified in browser and Tauri WebView: create page, edit title/body, autosave, reload, reopen, and confirm persisted content.
- Done: Auth polish is implemented in the Leptos shell: boot-time `/api/v1/auth/me` restore, immediate register/login app state, protected dashboard/editor surfaces, unauthenticated workspace access routing to sign-up, and logout from dashboard/editor.
- Done: Auth polish was verified in browser and Tauri WebView: fresh signed-out landing, Open workspace sign-up prompt, register-to-dashboard, reload session restore, editor access, logout, and protected post-logout state.
- Done: Production Tauri packaging is implemented: Leptos `dist` is bundled into the release desktop app, Tauri bundling is enabled, and an unsigned Windows MSI builds locally.
- Done: Release desktop was verified without Trunk: WebView loaded from `http://tauri.localhost/`, called the Rust API through `http://api.tauri.localhost:3317`, and completed register, session restore, editor open, logout, and protected post-logout checks.
- Done: Real page search is implemented through authenticated Postgres-backed `/api/v1/pages/search` and surfaced in a native Leptos command palette.
- Done: Initial Rust/Postgres AI and calendar surfaces are implemented: `/api/v1/ai/messages` answers from owned page search results through Groq when `GROQ_API_KEY` is configured, `/api/v1/calendar/integration` reports the local Postgres provider, and `/api/v1/calendar/events` returns calendar-linked pages.
- Done: Search/AI/calendar were verified in browser: create page, edit body, search body text from the command palette, open result, and ask NoteFlow AI against the saved page.
- Done: Page-to-calendar linking is implemented: the editor can link/unlink a page through `/api/v1/pages/{page_id}/calendar`, Postgres stores `calendar_sync_enabled` and `calendar_event_id`, and the dashboard Upcoming events panel reflects the linked pages.

## Key Changes
- Add a Rust API app, e.g. `apps/api-axum`, using:
  - `axum` + `tokio` for HTTP.
  - `sqlx` for Postgres access and migrations.
  - `argon2` for password hashing.
  - Secure opaque cookie sessions with server-side hashed session tokens.
- Extend the existing Rust client/types crates instead of creating a parallel contract:
  - Preserve the `{ ok: true, data } | { ok: false, error }` envelope.
  - Keep `/api/v1/*` as the stable API surface.
  - Point Leptos/Tauri clients at the Rust API, while the Next `/api/v1` bridge remains reference-only during transition.
- Implement initial Postgres schema:
  - `users`: email, password hash, name/image fields, timestamps.
  - `sessions`: user id, token hash, expiry/revocation timestamps.
  - `workspaces`: owner id, name, timestamps.
  - `pages`: workspace id, title, icon, cover, content JSON, favorite/archive fields, timestamps.
- Implement v1 auth/page endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/workspaces`
  - `GET /api/v1/pages`
  - `GET /api/v1/pages/search`
  - `PATCH /api/v1/pages/{page_id}/calendar`
  - `GET /api/v1/calendar/integration`
  - `GET /api/v1/calendar/events`
  - `POST /api/v1/ai/messages`
  - `GET /api/v1/usage`
- Build shell parity dual-track:
  - `apps/web-leptos`: landing, sign-in/sign-up, dashboard shell, sidebar, page list.
  - `apps/desktop-tauri`: loads the same Leptos UI and talks to the same Rust API.
  - Fix Windows Tauri prerequisite first: ensure `RC.EXE`/Windows SDK tooling is available so `cargo check --workspace` passes.

## Test Plan
- Rust verification:
  - `cargo check --workspace`
  - API unit tests for password hashing/session validation.
  - SQLx migration check against a local Postgres test database.
- API behavior:
  - Register/login/logout/me success and failure cases.
  - Unauthenticated requests return normalized `Unauthenticated`.
  - Pages/workspaces return only the signed-in user’s data.
- Frontend parity:
  - Leptos shell visually matches current Next dashboard/sidebar/auth screens.
  - Same shell route works in web and Tauri.
  - Current Next app remains runnable for reference comparison.
- Freeze enforcement:
  - `npm run freeze:check` should pass after settling the current baseline.
  - Future Next UI feature changes require an explicit freeze exception.

## Assumptions
- Current Next UI is the design source, not Figma for this milestone.
- Auth v1 is email/password only; OAuth and magic links are deferred.
- Editor parity comes after shell parity.
- Convex remains reference/legacy only during the rewrite; new Rust product data lives in Postgres.
