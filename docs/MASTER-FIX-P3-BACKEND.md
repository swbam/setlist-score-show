# MASTER-FIX Part 3 – Backend Implementation Roadmap

> Status: **Draft** (v0.1)
>
> This document describes the remaining backend work required to bring **TheSet** platform from ~60 % to full production-readiness.

## Table of Contents
1. Goals
2. High-Level Milestones
3. API Enhancements (Fastify + GraphQL)
4. Data Sync & Background Jobs (Supabase Edge Functions)
5. RPCs, Materialized Views & Caching
6. Data Quality, Deduplication & Validation
7. Auth, Security & Rate-Limiting
8. Observability (Logging, Tracing, Metrics)
9. Automated Testing Strategy
10. Roll-out & Migration Plan
11. Acceptance Criteria

---

## 1. Goals
* Deliver a **stable, scalable** backend API that powers real-time voting, search, and analytics at low latency (< 250 ms 95ᵗʰ).
* Consolidate background sync jobs into **edge functions** with unified error handling and retry logic.
* Eliminate data duplication and ensure referential integrity across `artists`, `shows`, `venues`, and related tables.
* Expose a clean **GraphQL schema** with pagination, sorting, and field-level auth rules.

## 2. High-Level Milestones
| # | Milestone | ETA |
|---|-----------|-----|
| 1 | Fastify v4 upgrade & plugin hardening | Day 1 |
| 2 | GraphQL schema audit & breaking-change clean-up | Day 2 |
| 3 | Edge Function consolidation (Ticketmaster, Spotify, setlist.fm) | Day 3–4 |
| 4 | Trending & cache RPC refinements + indexes | Day 4 |
| 5 | Deduplication utilities + cron | Day 5 |
| 6 | Auth/RLS hardening, rate limits | Day 6 |
| 7 | Observability stack (Pino → Logflare, OpenTelemetry) | Day 6–7 |
| 8 | Unit & integration tests (≥ 85 % coverage) | Day 7 |

## 3. API Enhancements
### 3.1 Fastify Plugins
* **cors.ts** – tighten origins to prod/staging domains.
* **auth.ts** – migrate to `@fastify/jwt` 8.x, use JWKs from Supabase.
* **presence.ts** – add heartbeat expiration via Redis‐TTL.
* Introduce **rate-limit plugin** (`@fastify/rate-limit`) for public endpoints (30 req / min / IP).

### 3.2 GraphQL
* Remove deprecated `Artist.popularityScore` (superseded by `popularity`).
* Add cursor-based pagination (`@devoxa/prisma-relay-cursor-connection`).
* Document schema in `docs/graphql-schema.md`.
* Enable persisted queries + persisted operation IDs for the web client.

### 3.3 REST Helpers
* `/health/*` endpoints already exist – add `/health/cache` to verify Redis.

## 4. Data Sync & Background Jobs
| Job | Source | Frequency | Notes |
|-----|--------|-----------|-------|
| **sync-top-shows** | Ticketmaster | Hourly | Replace REST fetch with `app.ticketmaster.com/discovery/v2/events` bulk endpoint (200 per page).
| **sync-spotify-data** | Spotify API | 6 h | Batch refresh artist genres + popularity.
| **sync-setlists** | setlist.fm | Daily | Avoid rate-limit: 2 req/s, retry × 3.
| **calculate-trending** | Internal | Hourly | Use Postgres function `refresh_homepage_cache()`.

Implementation tasks:
1. Combine duplicate versions (`sync-top-shows`, `sync-top-shows-v2`) into **one** canonical function.
2. Abstract common boilerplate into `supabase/functions/_shared/{auth.ts,cors.ts,supabase.ts,logger.ts}`.
3. Add exponential back-off retry wrapper.
4. Publish structured logs to **Logflare**.

## 5. RPCs, Materialized Views & Caching
* **homepage_cache** – ensure TTL column `expires_at` is indexed (`EXPLAIN ANALYZE`).
* `get_trending_artists()` & `get_top_shows()` –
  * accept `p_limit`, `p_from_cache boolean`.
  * fallback to direct query when cache miss.
* Add `REFRESH MATERIALIZED VIEW CONCURRENTLY trending_artists_distinct` during off-peak hours.

## 6. Data Quality & Validation
* Unique constraints: `(LOWER(name), ticketmaster_id)` on `artists`; `(artist_id, venue_id, date)` on `shows`.
* Create **deduplication service** in `services/dedupe.service.ts` – runs nightly, merges duplicates & re-parents FKs.
* Add Postgres CHECK constraints for positive vote counts.

## 7. Auth, Security & Rate-Limiting
* Enforce Supabase **Row Level Security** on `votes`, `setlist_songs`.
* Implement **JWT revocation list** for compromised tokens.
* Add **HMAC signature** validation for cron webhooks.

## 8. Observability
* **Pino** logger → sink to **Logflare**.
* **OpenTelemetry** traces exported to **Honeycomb**.
* **Prometheus** metrics via `/metrics` endpoint.

## 9. Automated Testing
* **Unit** – Prisma service mocks.
* **Integration** – spin-up `docker-compose` Postgres + Redis; use `supabase db reset --shadow`.
* **E2E** – Playwright suite already exists; extend with setlist vote concurrency test.

## 10. Roll-out & Migration Plan
1. Write migrations in `packages/database/prisma/migrations/20YYMMDD_backend_updates/`.
2. Run in staging → run smoke tests.
3. Deploy edge functions (`supabase functions deploy --project-id`).
4. Trigger production deployment behind feature flag.

## 11. Acceptance Criteria
* 95ᵗʰ pctl API latency < 250 ms.
* No duplicate `artists` / `shows` rows after nightly job.
* All sync jobs succeeding 3 consecutive runs.
* Test coverage ≥ 85 %, all Playwright tests green.
* Security scan (npm audit + Snyk) with 0 high-severity issues. 