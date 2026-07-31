
# LumenPages — Full Frontend E-Book Platform

A complete, mock-data-driven frontend for the e-book library described in your plan. No backend, no auth server, no file conversion — every screen renders from typed TypeScript fixtures so the whole UX is walkable end-to-end. Default look: **Charcoal Purple** (dark), with all 6 palettes switchable at runtime.

## Scope

**In:** every user-facing screen, responsive shell, theming system, in-browser reader UX, search/filter UI, reviews/shelves/profile UI, admin/moderation views (mocked).
**Out (frontend-only):** real auth, real uploads/conversion, real payments, real DMCA workflow, real analytics, backend APIs, database. Forms accept input and update local/in-memory state so flows feel real.

## Routes

```text
/                       Home (hero, featured carousels, recommendations)
/browse                 Search + faceted filters (genre, language, tags, rating)
/book/$bookId           Book detail (cover, metadata, reviews, related)
/read/$bookId           Immersive reader (pagination, TOC, bookmarks, notes)
/library                My shelves (Reading, Favorites, Completed, custom lists)
/upload                 Multi-step upload wizard (mock)
/profile/$userId        Public profile (bio, shelves, reviews, follow)
/settings               Account, theme picker, notifications, language
/auth/sign-in           Email + OAuth buttons (UI only)
/auth/sign-up           Registration (UI only)
/admin                  Admin dashboard (stats, moderation queue, DMCA)
```

Home lives at `/` (replaces placeholder). Each route defines its own `head()` (title, description, og:title, og:description). Book detail sets og:image from the cover.

## Responsive shell

- **Mobile (<768px):** fixed bottom nav — Home, Browse, Library, Upload, Profile. Top app bar with search icon + theme toggle.
- **Desktop (≥768px):** collapsible left sidebar (shadcn Sidebar) with the same sections plus Settings/Admin. Top bar retains search + theme + avatar menu.
- Reader route (`/read/$bookId`) hides both chrome for an immersive full-viewport experience with a floating toolbar.

## Theming system

Six palettes as CSS custom-property sets in `src/styles.css`, applied by toggling a `data-theme` attribute on `<html>`. Charcoal Purple is default. All shadcn tokens (`--background`, `--foreground`, `--primary`, `--card`, `--border`, etc.) map via `@theme inline` so every component re-skins instantly. Contrast pairs verified ≥4.5:1.

Palettes: Ocean Calm, Lavender Mist, Sandy Beach (light) · Night Sky, Forest Night, Charcoal Purple (dark). A theme picker in Settings and a quick toggle in the top bar persist choice in `localStorage` (read inside `useEffect` to avoid SSR mismatch).

## Reader UX

- Paginated view with prev/next, keyboard arrows, page slider.
- Table of contents drawer, chapter jump.
- Font size, font family (serif/sans), line height, column width, page margin controls.
- Highlight-to-note: selecting text opens a popover for highlight color + note (stored in local state).
- Bookmarks panel; reading progress bar; estimated time remaining.
- In-book search across mock chapter text.
- TTS button (uses browser `speechSynthesis`) — real, not mocked.
- Day/night reader theme independent of app theme.

## Data model (mock)

Typed fixtures in `src/data/`:
- `users.ts` — sample readers, authors, moderators, admin
- `books.ts` — ~30 books with cover, metadata, tags, chapters (lorem content)
- `reviews.ts`, `shelves.ts`, `notifications.ts`, `moderation.ts`
- `search.ts` — client-side fuzzy search (fuse.js) over books

A tiny Zustand store holds session (mock signed-in user), current theme, shelves mutations, bookmarks, and reader progress so interactions persist during a session.

## Visual direction

Charcoal Purple as the anchor: `#1E1E2E` background, `#D500F9` primary, `#7C4DFF` secondary, `#2979FF` accent, `#CCCCCC` text. Typography: **Space Grotesk** display + **Inter** body (loaded via `<link>` in `__root.tsx`). Rounded 2xl cards, soft neon glows on primary CTAs, subtle grain overlay in hero. Book cards use aspect-[2/3] covers with hover lift. Micro-interactions: framer-motion fade/slide on route change, spring on shelf add, skeleton loaders on browse.

Book covers use `imagegen` for ~12 hero/featured titles; the rest use deterministic gradient placeholders derived from title hash so the library feels populated without ballooning asset count.

## Tech notes

- Stack as-is: TanStack Start + React 19 + Tailwind v4 + shadcn.
- Add: `fuse.js` (search), `zustand` (state), `framer-motion` (motion), `react-pdf` NOT added (mock text-based reader instead — avoids Worker/PDF complexity).
- No server functions, no Cloud, no secrets.
- Each route has its own `head()`; `errorComponent`/`notFoundComponent` on data routes.

## Build phases

1. Theming system + shell (sidebar + bottom nav + top bar) + placeholder routes
2. Home + Browse + Book detail with mock data and generated covers
3. Reader (pagination, TOC, notes, bookmarks, TTS, in-book search)
4. Library/shelves + Profile + Settings (theme picker persists)
5. Auth pages, Upload wizard, Admin dashboard, Notifications drawer
6. Polish pass: motion, empty states, skeletons, 404/error, SEO metadata per route

Ready to build on approval.
