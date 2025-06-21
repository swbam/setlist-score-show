# MASTER-FIX Part 4 – Front-End Implementation Roadmap

> Status: **Draft** (v0.1)
>
> This document covers the tasks required to deliver an **Apple-tier** UI/UX for TheSet using **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

## Table of Contents
1. Goals
2. Design System & Global Styles
3. Page Revamp Checklist
4. Components & Patterns
5. Unified Search 2.0
6. Voting UX Polishing
7. State-Management & Data Fetching
8. Performance, SEO & Accessibility
9. Automated Testing (Unit + E2E)
10. Release Plan & Acceptance Criteria

---

## 1. Goals
* Deliver a visually stunning, responsive interface that feels **native-app smooth**.
* Ensure **Core Web Vitals** pass on mobile (< 2 s LCP, < 100 ms INP).
* Provide **consistent design language** and reusable UI primitives across the app.
* Reach **a11y score ≥ 95 %** in Lighthouse.

## 2. Design System & Global Styles
| Token | Example Value | Notes |
|-------|---------------|-------|
| **Colors** | `--primary: #06b6d4` | Dark/light modes via `class="dark"`.
| **Gradients** | `--gradient-primary` | Used in headings & buttons.
| **Radius** | `--card-radius: 20px` | Glassmorphism cards.
| **Blur** | `--blur-strength: 12px` | Backdrop filters.

Tasks:
1. Create `/styles/tokens.css` & import in `globals.css`.
2. Configure `tailwind.config.ts` to reference CSS variables.
3. Add typography plugin for better prose styling.
4. Build Figma library → export design tokens script.

## 3. Page Revamp Checklist
| Page | Status | Key Tasks |
|------|--------|----------|
| **Homepage** | 60 % | Integrate Hero, Stats, TrendingArtists, TopShows, lazy-load FeaturedTours.
| **Artist Detail** | 50 % | Responsive header (blurred hero img), tabbed nav (Overview, Shows, Songs), skeleton loader.
| **Show Detail** | 70 % | Real-time voting chart, setlist diff viewer, ticket CTA.
| **Search Results** | 0 % | Masonry grid + server component pagination.
| **Nearby** | 80 % | Mapbox integration for venue clustering.
| **Auth** | 60 % | SignUp/Login polished forms, social buttons, magic link.
| **Admin** | 40 % | DataSync dashboard, edge-function trigger UI.

## 4. Components & Patterns
* **UI Kit** – migrate duplicate `components/cards/*` into `packages/ui` and publish local workspace package.
* **Motion** – create `MotionCard`, `FadeInStagger` utilities.
* **Skeletons & Suspense** – use React `suspense-boundary` for server components.
* **Dark mode** – persisted in `localStorage` + `class` toggle.

## 5. Unified Search 2.0
* Split into **SearchProvider** (global context) + **SearchBar** + **SearchResultsPopover**.
* Keyboard navigation (↑/↓, ⏎) using `@radix-ui/react-primitive`.
* Use **React Query** with **Supabase row-level cache key** to dedupe identical queries.
* Add **analytics hook** to record query + result count.

## 6. Voting UX Polishing
1. Replace current `VoteButton` busy-waiting with **optimistic update** pattern.
2. Show confetti burst (`canvas-confetti`) after user hits 10 votes limit.
3. Sticky mini-player bar (current vote count) on mobile.
4. Accessible button announcements (`aria-live`).

## 7. State-Management & Data Fetching
* Use **TanStack Query 5** for client data (votes, user session).
* Keep **Server Components** for heavy read paths (homepage, explore).
* Implement **`/graphql` persisted queries** fetched via `next-cache`.
* Global error boundary → Sentry.

## 8. Performance, SEO & Accessibility
* **Images** via `next/image` + blur placeholders.
* Code-split heavy routes with `dynamic(() => import())`.
* Add `<Suspense>` streaming for above-the-fold.
* SEO: `next/seo` – title templates, `og:image` generation.
* a11y: Color-contrast tokens audit, keyboard focus ring, alt text linter.

## 9. Automated Testing
* **Unit** – Jest + React Testing Library for UI components.
* **Visual** – Chromatic CI (Storybook snapshots).
* **E2E** – Playwright mobile + desktop viewports; scenarios: search, vote, compare setlists.

## 10. Release Plan & Acceptance Criteria
1. Roll out to **staging.vercel.app** behind password.
2. Run Lighthouse CI – target scores **≥ 90/90/90/95** (PWA/Perf/SEO/a11y).
3. QA checklist (iOS Safari, Android Chrome, Edge desktop).
4. Feature flag `unified-search-v2`, `new-homepage` → gradual rollout 10 % → 100 %.

**Done when:**
* All redesigned pages have ≥ 95 % visual parity with Figma.
* CLS < 0.1 on mobile.
* a11y scan passes (< 5 warnings, 0 errors).
* All Playwright tests green. 