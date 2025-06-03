# Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Variables
- [x] Created `.env` files for all apps with correct Supabase credentials
- [x] DATABASE_URL points to Supabase PostgreSQL
- [x] All API keys configured (Spotify, Setlist.fm, Ticketmaster)
- [ ] Create deployment tokens:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID  
  - [ ] VERCEL_PROJECT_ID
  - [ ] RAILWAY_TOKEN
  - [ ] CLOUDFLARE_ZONE_ID (optional)
  - [ ] CLOUDFLARE_API_TOKEN (optional)

### 2. Database Setup
- [ ] Run migrations on Supabase: `./scripts/migrate-remote-db.sh`
- [ ] Verify schema matches TheSet-Fixes.md requirements
- [ ] Create indexes for performance
- [ ] Set up RLS policies if needed

### 3. Supabase Configuration
- [x] Edge Functions created in `/supabase/functions/`
- [ ] Deploy Edge Functions: `cd supabase/functions && ./deploy-all.sh`
- [ ] Configure cron schedules in Supabase Dashboard:
  - sync-setlists: Daily at 2 AM
  - sync-spotify: Daily at 3 AM  
  - calculate-trending: Every 4 hours
  - sync-artists: Every 6 hours
  - cleanup-old-data: Weekly on Sunday

### 4. Build Verification
- [ ] Run `pnpm install` to install all dependencies
- [ ] Run `pnpm build` to build all packages
- [ ] Run `pnpm test` to verify tests pass
- [ ] Run `pnpm lint` to check code quality

## Deployment Steps

### 1. Deploy Database Migrations
```bash
export DATABASE_URL="postgresql://postgres.ailrmwtahifvstpfhbgn:G7C5c3EAjmGe8Ea3@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
cd packages/database
pnpm prisma migrate deploy
```

### 2. Deploy Supabase Edge Functions
```bash
cd supabase
supabase login
supabase link --project-ref ailrmwtahifvstpfhbgn
supabase functions deploy sync-setlists
supabase functions deploy sync-spotify
supabase functions deploy calculate-trending
supabase functions deploy sync-artists
supabase functions deploy cleanup-old-data
```

### 3. Deploy API to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up --service api
```

### 4. Deploy Web to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
cd apps/web
vercel link

# Deploy to production
vercel --prod
```

## Post-Deployment

### 1. Verify Deployments
- [ ] Web app accessible at production URL
- [ ] API health check returns 200: `https://api-url/health`
- [ ] GraphQL playground works: `https://api-url/graphql`
- [ ] Edge Functions responding to test calls

### 2. Configure Domains
- [ ] Point custom domain to Vercel
- [ ] Configure SSL certificates
- [ ] Set up CDN if using Cloudflare

### 3. Monitor Initial Performance
- [ ] Check Supabase Dashboard for database performance
- [ ] Monitor Edge Function logs
- [ ] Verify real-time features working
- [ ] Test voting functionality

### 4. Set Production Environment Variables
In Vercel Dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_API_URL (Railway API URL)
- All API keys

In Railway Dashboard:
- DATABASE_URL
- REDIS_URL (if using external Redis)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- All API keys
- FRONTEND_URL (Vercel URL)

## Rollback Plan

If issues occur:
1. Revert Vercel deployment: `vercel rollback`
2. Revert Railway deployment via dashboard
3. Restore database backup if schema changes caused issues
4. Re-deploy previous Edge Function versions

## Monitoring

Set up monitoring for:
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Database monitoring (Supabase Dashboard)
- [ ] API monitoring (Railway metrics)