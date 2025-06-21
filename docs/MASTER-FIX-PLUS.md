# MASTER FIXES **ULTRA-DRAFT** – TheSet Concert Setlist Voting Platform  
_Part 1 of 3 (Lines 1-400)_  
(This document will ultimately span ≈1200 lines. After you review Part 1, I will commit Parts 2 and 3.)

## 0  Purpose & Scope
1. Create a **single source of truth** for bringing TheSet from ~80 % to **100 % functional completion**.  
2. Focus on **data consistency**, **homepage/top-shows accuracy**, **search correctness (Ticketmaster-first)**, and **UI parity across pages**.  
3. Exclude random analytics/logging dashboards (requested by user).  
4. Deliver a **step-by-step implementation outline** developers can follow without ambiguity.

---

## 1  High-Level Goals (10 bullets)
1. Homepage renders within < 200 ms TTFB.  
2. Top Artists/Shows reflect Ticketmaster popularity, updated hourly.  
3. Unified Search fetches Ticketmaster first, falls back to local DB.  
4. ZIP-code "Near Me" search fully operational via PostGIS radius query.  
5. No duplicate artists/venues/shows after sync.  
6. Voting flow stays real-time (< 1 sec end-to-end).  
7. Admin dashboard can trigger syncs & view counts.  
8. Continuous deployment: one command to migrate & ship.  
9. Mobile experience polished to Apple-tier design spec.  
10. Complete automated test coverage for all critical paths.

---

## 2  Key Personas (Condensed)
1. **Fan User** – wants to discover, vote, compare setlists.  
2. **Admin** – manages data, monitors sync jobs.  
3. **Developer** – maintains code, deploys without fear.

---

## 3  Current Pain-Points (Top 8)
1. Homepage breaks – missing `homepage_cache` in prod.  
2. Search slow – DB `ilike` over ~50 k songs.  
3. Edge-function duplication – triple TM syncs cause confusion.  
4. Partial migrations applied – local ≠ prod.  
5. Mobile layout glitches (cards overlap).  
6. No location search (ZIP) despite docs.  
7. Vote limit bug – users can bypass via Incognito.  
8. Inconsistent loading skeletons across pages.

---

## 4  Architecture Overview (Narrative)
1. **External Source**: Ticketmaster Discovery API (`/events?sort=relevance`).  
2. **Edge Functions**: `sync-top-shows` (hourly), `sync-spotify-data` (6 h), `sync-setlists` (daily).  
3. **Database**: Supabase PG15 with PostGIS.  
4. **Aggregation**: PL/pgSQL `refresh_homepage_cache`.  
5. **Serving Layer**: Next.js 14 App Router (RSC SSR).  
6. **Realtime Layer**: Supabase Realtime broadcasts vote counts.  
7. **Client**: React 18, Tailwind, Framer-Motion.

---

## 5  Data Flow (Step-List)
**A. Ticketmaster → Database**  
  1. Cron hits Edge Function hourly.  
  2. Iterate pages (size = 200, max 10 pages) = 2000 events.  
  3. For each event: dedup venue, dedup artist, upsert show.  
  4. On new show insert → call RPC `create_initial_setlist`.  
  5. At end: `SELECT refresh_homepage_cache()`.

**B. Homepage Render**  
  1. Next.js server component fetches `homepage_cache` rows `top_artists` & `top_shows`.  
  2. If rows exist & not expired → return JSON to component.  
  3. If cache miss → SSR triggers `refresh_homepage_cache()` RPC then refresh.  
  4. Hydrated React renders cards; no client DB calls.

**C. Search**  
  1. User types; 300 ms debounce.  
  2. If 5-digit ZIP – redirect `/nearby/ZIP`.  
  3. Else: client fetch `/api/search?q=foo`.  
  4. API route server-side fetches Ticketmaster (limit = 5).  
  5. If < 5 results → queries internal `search_unified` RPC.  
  6. Returns consolidated list to dropdown.

---

## 6  Database Layer (Detail) – Tables + Migration Tasks  
### 6.1 Tables (Existing + New Flags)
| № | Table | Action | Critical Columns | Notes |
|---|-------|--------|------------------|-------|
| 1 | artists | verify | `id`, `name`, `ticketmaster_id`, `slug`, `popularity` | ensure UNIQUE(slug) |
| 2 | venues | verify + alter | `id`, `ticketmaster_id`, `location` | add GIST on location |
| 3 | shows | verify + add index | `ticketmaster_id`, `date`, `status` | index(status,date) |
| 4 | setlists | verify | `show_id`, `is_actual` | — |
| 5 | setlist_songs | verify | `setlist_id`, `vote_count` | — |
| 6 | votes | verify + rule | `user_id`, `show_id` | enforce 10/show limit |
| 7 | ⬚ homepage_cache | **create** | `cache_key`, `data`, `expires_at` | materialised payload |
| 8 | ⬚ zip_codes | **create** | `zip_code`, lat/lng | radius search |
| 9 | sync_state | verify | `job_name`, timestamps | job bookkeeping |

### 6.2 Migrations (Sequential)
1. **Create homepage_cache**  
   ```sql
   CREATE TABLE IF NOT EXISTS homepage_cache(
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      cache_key text UNIQUE NOT NULL,
      data jsonb NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now()
   );
   ```
2. **PL/pgSQL `refresh_homepage_cache()`** (full body in Part 2).  
3. **Enable PostGIS & add `location`** to `venues`.  
4. **Seed `zip_codes`** via COPY from CSV (US Zips dataset).  
5. **Constraints**: add `CHECK (vote_count >= 0)`.

### 6.3 RLS Policies (Summary)
* `artists`, `shows`, `venues`, `homepage_cache` → `SELECT` allowed for role `anon`.  
* `votes` → `INSERT` allowed when `auth.uid() = user_id`.  
* No `UPDATE`/`DELETE` for `anon`.

---

## 7  Backend: RPCs & Edge Functions (High-Level Specs)  
### 7.1 RPC List (8 functions)
1. `refresh_homepage_cache()` – refresh 2 JSON blobs.  
2. `get_nearby_shows(zip text, radius_km int)` – return 50 shows within radius.  
3. `create_initial_setlist(show_id uuid, artist_id uuid)` – pick 5 songs.  
4. `vote_increment(song_id uuid, user_id uuid)` – safe vote increment.  
5. `search_unified(query text)` – fallback search across artists, shows.  
6. `cleanup_old_data()` – purge shows older than 180 d.  
7. `admin_trigger_sync(job text)` – dispatch http call to edge function.  
8. `stats_overview()` – counts for admin dashboard.

### 7.2 Edge Function: **sync-top-shows (canonical)**
1. Read `TICKETMASTER_API_KEY` from env.  
2. Determine timeframe: start = now, end = +90 days.  
3. For `page` in `0..9`:
    * fetch up to 200 events.  
    * dedup venue via `ticketmaster_id`.  
    * insert or update venue (lat/lng ➜ geography).  
    * dedup artist.  
    * insert or update artist (popularity ≈ event.score × 100).  
    * dedup show.  
    * insert show; call `create_initial_setlist`.  
4. Insert sync metrics into `sync_state`.  
5. Call `refresh_homepage_cache()`.  
6. Return JSON { processed, inserted }.

---

## 8  Frontend: Component Storyboard (Overview, details in Part 2)  
### 8.1 Global Layout
* `<Header>` – logo, search bar, auth links.  
* `<Footer>` – navigation, copyright.  
* `<Toaster>` – global notifications.

### 8.2 Page Inventory (names only)
1. `/` – Homepage  
2. `/artists` – Artists index  
3. `/artists/[slug]` – Artist detail  
4. `/shows/[id]` – Show voting  
5. `/nearby/[zip]` – Near-Me shows  
6. `/votes` – My votes  
7. `/admin` – Admin dashboard  
8. `/auth/*` – Auth routes (handled by Supabase UI)  
9. `/terms`, `/privacy` – static.

### 8.3 Data Fetch Layer
* All server components fetch via Supabase Server Client (`createServerComponentClient`).  
* No direct client DB calls except Realtime and voting mutation.  
* Search API handled via Next.js route `/api/search`.

---

## 9  Unified Search Component (High-Level)
1. React state: `query`, `results`, `loading`.  
2. Debounced handler 300 ms.  
3. ZIP detection regex =`/^\d{5}$/`.  
4. If ZIP → `router.push('/nearby/'+zip)`.  
5. Else fetch `/api/search?q=`.  
6. Render dropdown list; clicking clears query, closes menu.  
7. Variants: `hero`, `header`, `mobile` (different styling).

---

## 10  Voting Flow Fixes (Bug List)
1. **Bypass via Incognito** – enforce `votes_per_user_per_show` constraint in DB trigger.  
2. **Race Condition** – use `vote_increment` RPC (atomic update).  
3. **UI Timeout** – show optimistic toast on click, revert on error.  
4. **Realtime Glitch** – ensure Realtime broadcast row-level updates on `setlist_songs`.

---

## 11  UI/UX Polish Requirements (Checklist Segment)
* Consistent skeleton loaders (shimmer).  
* Card border-radius 20 px; shadow `rgba(0,0,0,0.05)`.  
* Framer Motion fade-in `duration: 0.4`.  
* Dark mode – auto via `class="dark"` on `<html>`.  
* Image placeholders – blur-up (Next.js).  
* Accessible colors – WCAG AA contrast.

---

_End of Part 1 (Lines ≈ 400).  Continue → Part 2 will cover:_  
* Detailed PL/pgSQL function bodies  
* Page-by-page Component trees with prop lists  
* Exact SQL indexes  
* CI/CD step commands  
* Rollback procedure  
* Phase timeline with hour estimates 