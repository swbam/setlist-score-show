# MASTER-FIX Part 5 – Deployment & Operations Roadmap

> Status: **Draft** (v0.1)
>
> This document details the production deployment, CI/CD, and operational readiness plan for **TheSet**.

## Table of Contents
1. Architecture Overview
2. Environments & Branching Strategy
3. Infrastructure Provisioning
4. CI/CD Pipeline (GitHub Actions)
5. Database Migration & Seeding Flow
6. Edge Function Deployment Workflow
7. Frontend (Vercel) Deployment Workflow
8. Monitoring, Alerting & Incident Response
9. Security & Compliance
10. Rollback / Disaster Recovery Strategy
11. Go-Live Checklist & Timeline

---

## 1. Architecture Overview
```
┌──────────────────────────────────────────┐
│                GitHub Repo              │
└──────────┬──────────────────────────────┘
           ▼
  GitHub Actions →  build / test / deploy
       │                │           |
       │                │           ├──►  Supabase  (DB + Edge Functions)
       │                │           ├──►  Railway   (Fastify API)
       │                │           └──►  Vercel    (Next.js Web)
       │                │
       └──► Sentry / Percy (QA)  
```

## 2. Environments & Branching Strategy
| Branch | Env | URL | Notes |
|--------|-----|-----|-------|
| `main` | Production | `the-set.app` | Protected; PR > 1 approval.
| `develop` | Staging | `staging.the-set.app` | Auto-deploy on push.
| `feature/*` | Preview | Vercel preview | PR comment URL.

*Use **GitHub environments** to scope secrets & approvals.*

## 3. Infrastructure Provisioning
* **Supabase** project already created (`ailrmwtahifvstpfhbgn`).  Enable PITR (Point-in-time recovery).
* **Railway**: create service from `./apps/api/Dockerfile`; allocate 512 MB / 1 vCPU; configure auto-sleep for previews.
* **Vercel**: link `apps/web`; set build command `pnpm turbo run build --filter web...`.
* **Logflare**: provision dedicated source; connect to Supabase & Fastify logs.
* **Sentry**: one project per env (web & api).
* **Honeycomb**: dataset `the-set` for OTLP traces.

## 4. CI/CD Pipeline (GitHub Actions)
* **workflows/**
  * `test.yml` – lint + unit + integration (runs on PR).
  * `e2e.yml` – Playwright in headless Chrome (runs nightly).
  * `deploy.yml` – matrix deploy (supabase/edge-functions, railway/api, vercel/web) on merge to `develop` or `main`.

Key steps (pseudo-YAML):
```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v3
- run: pnpm install --frozen-lockfile
- run: pnpm turbo run test --parallel
- run: pnpm turbo run build --filter api...
- run: pnpm turbo run build --filter web...
- name: Deploy Edge Functions
  run: supabase functions deploy --project-id $SUPABASE_PROJECT --linked --non-interactive
- name: Deploy Railway API
  uses: railwayapp/cli-action@v0.2
  with: { command: up --service api }
- name: Deploy Vercel Web
  uses: amondnet/vercel-action@v25
  with: { vercel-token: $VERCEL_TOKEN, scope: $VERCEL_ORG_ID, env: production }
```

## 5. Database Migration & Seeding
1. **Migrations** live in `packages/database/prisma/migrations/`.
2. On CI:
   * spin-up temp Postgres (`supabase db start`) → run `prisma migrate deploy`.
   * Run seed script `pnpm --filter @theset/db db:seed`.
3. In prod: gated by **manual approval** in GitHub environment.
4. Schedule nightly **db-health report** via `supabase/migrations-healthcheck.sql`.

## 6. Edge Function Deployment Workflow
* Functions live in `supabase/functions/*`.
* `supabase link --project-id` executed once; `.supabase/config.toml` committed.
* Use **import map** to pin Deno dependencies.
* CI step compiles TypeScript to Deno Deploy bundle; fails build if type errors.
* Post-deploy hook triggers `/admin/sync/trigger` to prime caches.

## 7. Frontend Deployment (Vercel)
* **Next.js 14** builds with `output: 'standalone'`.
* Set **edge runtime** for SSR (`runtime:'edge'`) on high-traffic pages.
* Enable **Image Optimization** via Vercel.
* Generate `next-sitemap` in post-build step.

## 8. Monitoring, Alerting & Incident Response
| Tool | Signals | Threshold | Action |
|------|---------|-----------|--------|
| **Logflare** | 5xx API logs | > 30 / 5 min | PagerDuty.
| **Vercel** | build failures | any | Slack alert.
| **Supabase** | CPU > 80 % | 10 min | Scale up.
| **Sentry** | new error event | > 5 / 1 min | Triage.
| **Honeycomb** | p95 latency | > 400 ms | Investigate.

Runbooks stored in `docs/runbooks/*.md`.

## 9. Security & Compliance
* **Secrets** stored in GitHub Encrypted Secrets & Supabase/KV.
* Automated **Dependabot** PRs weekly.
* **OWASP ZAP** scan in nightly CI.
* GDPR: provide data export & delete endpoint (`/api/user/data`).

## 10. Rollback / Disaster Recovery
* Vercel instant rollback via previous build.
* Railway keeps last 5 deploy snapshots; `railway status --rollback`.
* Supabase PITR (7-day window) – documented test restore quarterly.
* Edge functions: keep previous version (`supabase functions versions list`).

## 11. Go-Live Checklist & Timeline
| Task | Owner | Date |
|------|-------|------|
| Load test (k6, 500 VU) | DevOps | T-7d |
| Security penetration test | SecOps | T-5d |
| Data backup verified | DBA | T-3d |
| Final UAT sign-off | Product | T-2d |
| Feature flags to **100 %** | Eng | T-0 |
| Post-launch monitoring (24 h) | On-call | T+1d |

**Launch window:** Tuesday 10:00-11:00 EST (lowest traffic).

---

**Success =** zero critical incidents in first 72 h, < 1 % error rate, p95 API latency < 300 ms, Core Web Vitals green. 