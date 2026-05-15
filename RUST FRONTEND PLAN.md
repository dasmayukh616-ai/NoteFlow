## NoteFlow Frontend-First Rewrite Plan (Leptos + Figma + Dual-Track Web/Desktop, 12+ Months)

### Summary
We will execute a frontend-first rewrite now, with **Leptos as primary UI framework**, in a **dual-track web + Tauri desktop** delivery model, and **sequential full parity** with the current app (`shell -> core -> AI/calendar -> full parity`).  
Design authority stays with you: each cycle starts from your Figma handoff (`file URL + page/frame IDs`), then implementation follows a fixed Figma-to-code workflow.

### Implementation Changes
1. **Program Setup (Month 0-1)**
- Freeze current Next.js app as reference behavior (no feature expansion during parity rewrite).
- Create Rust workspace layout:
  - `apps/web-leptos` (browser app)
  - `apps/desktop-tauri` (desktop shell)
  - `crates/noteflow-ui` (shared UI primitives/components)
  - `crates/noteflow-types` (DTOs/domain types)
  - `crates/noteflow-client` (API client adapters)
- Define migration rule: backend remains current Convex/Next until frontend parity is complete.
- Add a thin compatibility API layer for the parity phase so the new frontend does not couple directly to React/Convex hooks.

Program setup kickoff artifacts created:
- Rust workspace manifest and crate/app scaffolds at repository root (`Cargo.toml`, `apps/*`, `crates/*`).
- Compatibility API contract helpers under `src/lib/parity-api/*`.
- Initial parity API health endpoint at `/api/v1/health`.
- Migration guardrails documented in `docs/frontend-parity-rules.md`.

2. **Figma-Driven Delivery Loop (Runs Every Sprint, Month 1+)**
- Input: you provide Figma URL + exact frame IDs for the sprint scope.
- Execution workflow per feature:
  - Inspect frame + tokens/components
  - Map frame to Leptos component structure
  - Implement section-by-section
  - Validate via screenshots/visual diff before merge
- Figma skills usage policy:
  - Default: `figma-implement-design` + `figma-use`
  - If token/component drift appears: `figma-generate-library` to reconcile design system rules.

3. **Feature Parity Roadmap (Month 1-12+)**
- **Phase A (Month 1-3): Shell parity**
  - Landing, auth screens, dashboard layout, sidebar/nav, theme behavior.
  - Start Tauri shell in parallel with same routed UI bundle (no platform-specific divergence yet).
- **Phase B (Month 3-6): Core workspace parity**
  - Pages/workspaces CRUD, global command/search UX, settings surface.
  - Editor strategy locked: use JS interop wrapper for rich text initially (Tiptap-compatible bridge) to avoid blocking parity.
- **Phase C (Month 6-9): Collaboration/productivity parity**
  - Calendar screens, connect/disconnect states, event list and meeting-note creation flows.
  - AI sidebar/chat UX parity including loading, error, and retry states.
- **Phase D (Month 9-12+): Full parity + hardening**
  - Visual/design parity pass across all routes.
  - Desktop-specific polish (windowing, shortcuts, persistence, packaging).
  - Remove old frontend once parity gates pass on web and desktop.

4. **Dual-Track Web/Desktop Rules**
- Shared UI and routing logic lives in shared crates; platform-only code isolated behind adapters.
- Web remains release lead; desktop trails by one sprint until Phase D, then reaches zero-lag parity.
- No separate design language for desktop until full web parity is complete.

5. **Parity Backend Bridge**
- Keep existing backend logic as the source of truth during parity:
  - Convex functions
  - Next route handlers for AI and calendar flows
- Expose stable `v1` HTTP endpoints as a BFF/adapter layer that map to those backend operations.
- Build one shared Rust client crate (`crates/noteflow-client`) used by both web and desktop with different transports:
  - Leptos web via WASM HTTP transport
  - Tauri desktop via native HTTP transport
- Normalize all backend responses into shared DTOs in `crates/noteflow-types` so UI code stays backend-agnostic.
- Keep realtime simple during parity:
  - use request/response and short polling first
  - add SSE/WebSocket bridging only for screens that truly need live updates
- Auth rules during parity:
  - web uses the existing Clerk browser session/cookies
  - desktop uses a token/session exchange flow and then calls the same `v1` endpoints with bearer auth
  - backend authorization remains enforced server-side exactly as it is today
- Desktop session flow:
  - open the system browser for sign-in
  - use PKCE and a deep-link or loopback callback
  - exchange the callback code for short-lived access tokens and rotated refresh tokens
  - store refresh tokens in Tauri secure storage, keep access tokens in memory, and revoke on logout

### Public APIs / Interfaces / Types
- Introduce a stable frontend contract layer in `crates/noteflow-types`:
  - `User`, `Workspace`, `Page`, `Block`, `CalendarIntegration`, `CalendarEvent`, `AIMessage`, `UsageStats`.
- Introduce a client abstraction in `crates/noteflow-client`:
  - `AuthApi`, `PagesApi`, `CalendarApi`, `AiApi`, `UsageApi` traits with concrete adapters for current backend endpoints.
- Introduce a `v1` backend surface that remains stable across web and desktop clients during the parity phase.
- Normalize UI-facing error model:
  - `Unauthenticated`, `Unauthorized`, `RateLimited`, `ValidationError`, `UpstreamUnavailable`, `Unknown`.
- Keep backend wire contract unchanged during frontend phase; only frontend adapters evolve.

### Test Plan
- **Design fidelity gates**
  - Per-frame visual comparison against provided Figma frame IDs before merge.
  - Component-level screenshot tests for high-variance surfaces (editor, sidebar, calendar cards, AI panel).
- **Behavioral parity**
  - E2E flows for: sign-in, create/edit page, search/command, calendar connect/fetch/create note, AI chat request.
  - Run each flow on both web and Tauri targets.
- **Regression/perf**
  - Route-level smoke suite on every PR.
  - Baseline startup/render timings tracked for web and desktop with alert thresholds.
- **Release gates**
  - Phase exit requires: parity checklist green, no critical visual diffs, no P0 flow regressions.

### Assumptions and Defaults
- You will provide final Figma deliverables per sprint as `Figma URL + page/frame IDs`.
- Frontend phase does **not** include Axum/SurrealDB backend migration work yet.
- Rich text parity is achieved first via JS-editor interop; pure Rust editor is explicitly deferred.
- Timeline target is 12+ months with sequential parity and no parallel backend rewrite.
- Desktop sign-in uses system-browser OAuth with PKCE, deep-link or loopback callback handling, and secure token storage in Tauri.
- Web parity uses the current Clerk cookie/session model without changing the existing browser auth flow.
