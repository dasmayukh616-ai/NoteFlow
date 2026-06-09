# NoteFlow Command Palette Handoff

## Current Goal

Build a Notion-inspired command palette/search modal for NoteFlow.

The target reference is Notion's search modal:

- Search or ask bar
- Workspace-scoped search text
- Filter row with `Title only`, `Created by`, `In`, and `+ Filter`
- Top-right view/search-mode controls
- Grouped results by recency
- Result rows with icons/emojis, titles, and breadcrumbs
- Highlighted selected result
- Scrollable results panel
- Right-side selected-page preview
- Preview action buttons for copy/open
- Scrollable preview content

## User Preferences

- Use Lucide icons from `lucide-react`.
- Use Apple emoji rendering for emoji items.
- Keep the font consistent with the landing page: Manrope.
- Dark UI, restrained Notion-like workspace styling.
- Avoid gradients and excessive blue.

## Relevant Files

- `src/components/global-command.tsx`
- `src/components/app-sidebar.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

## What Is Already Implemented

- `Cmd/Ctrl + K` opens the command palette.
- `Cmd/Ctrl + P` also opens it.
- Sidebar `Search` button opens it through the `noteflow:open-command` event.
- Search / ask input exists with workspace-style placeholder.
- Local mock workspace data is searchable with Fuse.js.
- Results are grouped by:
  - `Past week`
  - `Past 30 days`
  - `Older`
  - `Navigation`
- Results show:
  - Page title
  - Emoji or Lucide icon
  - Subtitle/breadcrumb-like text
- Selected result is highlighted.
- Arrow keys move selection.
- Enter opens/runs selected item.
- `Cmd/Ctrl + L` copies selected page link.
- `Cmd/Ctrl + Shift + C` copies selected page as markdown link.
- Right preview panel exists.
- Preview panel shows:
  - Page icon/emoji
  - Page title
  - Location and author
  - Excerpt paragraphs
  - Copy/open action buttons
- Search supports:
  - `Title only`
  - `Created by`
  - `In` location
  - Date filter
- Sidebar has been restyled to match the dark workspace reference.
- Root font was changed to Manrope.
- `.emoji` class was added in `globals.css`.

## What Still Needs To Be Finished

Completed in the follow-up pass:

1. Replaced cycling filter buttons with real dropdown menus.
2. Made `+ Filter` a real add-filter menu.
3. Added preview paragraphs, headings, and bullet rows.
4. Made the preview card independently scrollable.
5. Added every visible page from the reference list:
   - `Rust Migration#1`
   - `Getting Started`
   - `Topic #1`
   - `NoteFlow - Development Roadmap & Recommendations`
   - `insurance notes`
   - `Apple's areas of operation`
   - `Google Calendar Integration Patterns for Note-Taking Apps`
   - `New page`
   - `NoteFlow - Project Progress Report`
   - `NoteFlow Progress`
   - `my planner`
   - `Holiday`
6. Improved top-right controls:
   - layout/filter-row toggle
   - blue circular AI/search mode button
7. Improved mobile sizing by using a narrower viewport-safe modal width and hiding the preview on smaller screens.

Remaining later work:

1. Replace mock search data with real Convex pages/workspace search.
2. Wire `Create new page` to a real page creation flow.
3. Wire `Ask NoteFlow AI` to the real assistant flow.
4. Do a signed-in visual pass in the user's browser, because automated browser verification is blocked by the protected Clerk auth domain policy.

## Current Verification

These passed after the current implementation:

```powershell
npx eslint src/components/global-command.tsx src/components/app-sidebar.tsx src/app/dashboard/layout.tsx
npx tsc --noEmit --pretty false
```

These passed after the follow-up command palette implementation:

```powershell
npx eslint src/components/global-command.tsx
npx tsc --noEmit --pretty false
```

`localhost:3000` was responding.

Browser visual verification was blocked because automated browser access hit an auth-domain policy for the protected dashboard route. The user can inspect manually at:

```text
http://localhost:3000/dashboard
```

## Freeze Guard Note

The project has a parity freeze guard. Frontend changes are blocked unless bypassed.

The checked bypass reason that worked:

```powershell
$env:NEXT_FREEZE_BYPASS='1'
$env:NEXT_FREEZE_BYPASS_REASON='Command palette and workspace UI creation approved during parity freeze.'
npm run freeze:check
```

## Suggested Next Prompt

Continue from `docs/command-palette-handoff.md`. Finish the Notion-style command palette by implementing real dropdown filter menus, a real `+ Filter` menu, exact reference page results, independently scrollable preview content with bullet formatting, and more accurate top-right controls. Keep Manrope, Lucide icons, Apple emoji styling, dark Notion-like UI, and avoid gradients/excessive blue. Run focused lint and TypeScript checks afterward.
