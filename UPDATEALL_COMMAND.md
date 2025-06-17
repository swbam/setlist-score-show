# TheSet - Complete Update & Deployment Command

## Overview

The `pnpm updateall` command is a comprehensive deployment script that handles **everything** needed to get TheSet fully deployed and running in production.

## What it does

This single command performs all of the following tasks in sequence:

### 🔧 **Infrastructure Setup**
- ✅ Checks all prerequisites (pnpm, supabase, psql, etc.)
- ✅ Configures environment variables
- ✅ Installs all workspace dependencies
- ✅ Runs type checks and linting

### 🏗️ **Build & Database**
- ✅ Builds all packages (web, api, shared packages)
- ✅ Runs all database migrations
- ✅ Generates Prisma client

### ☁️ **Supabase Deployment**
- ✅ Sets all Supabase secrets (API keys, tokens)
- ✅ Deploys all Edge Functions
- ✅ Sets up automated cron jobs
- ✅ Configures scheduled sync tasks

### 🧪 **Testing & Validation**
- ✅ Tests the complete sync system
- ✅ Validates backend functionality
- ✅ Runs health checks on all services

### 🚀 **Application Deployment**
- ✅ Deploys web app to Vercel (if available)
- ✅ Deploys API to Railway (if available)
- ✅ Verifies all deployments

## Usage

Simply run:

```bash
pnpm updateall
```

That's it! The script will handle everything automatically.

## Prerequisites

Make sure you have these installed:

- **Required:**
  - `pnpm` - Package manager
  - `supabase` CLI - Database and functions
  - `psql` - PostgreSQL client

- **Optional (for full deployment):**
  - `vercel` CLI - For web deployment
  - `railway` CLI - For API deployment

## What happens during execution

The script runs **11 comprehensive steps**:

1. **Prerequisites Check** - Validates all required tools
2. **Environment Setup** - Configures environment and Supabase connection
3. **Install Dependencies** - Installs all workspace packages
4. **Quality Checks** - Runs TypeScript and linting
5. **Build Packages** - Builds all applications and libraries
6. **Database Migrations** - Applies all database changes
7. **Set Secrets** - Configures Supabase API keys and tokens
8. **Deploy Functions** - Deploys all Edge Functions
9. **Setup Cron Jobs** - Configures automated sync schedules
10. **Test Sync System** - Validates data synchronization
11. **Deploy Applications** - Pushes to production platforms
12. **Health Checks** - Verifies everything is working

## Sync Schedules Configured

The script automatically sets up these cron jobs:

- **Sync Artists**: Every 6 hours
- **Calculate Trending**: Every 4 hours  
- **Sync Setlists**: Daily at 2 AM
- **Sync Spotify**: Daily at 3 AM
- **Cleanup Old Data**: Weekly on Sunday at 4 AM

## Post-Deployment

After running `pnpm updateall`, you should:

1. Check the Supabase Dashboard
2. Monitor Edge Function logs
3. Verify cron jobs are running
4. Test production endpoints
5. Update production secrets if needed

## Useful Commands

After deployment, use these commands for maintenance:

```bash
pnpm manual-sync        # Run manual data sync
pnpm backend:test       # Test backend systems
pnpm sync:trending      # Refresh trending data
supabase functions logs # Monitor function logs
```

## Troubleshooting

If the script fails:

1. Check the error message - it will show exactly what failed
2. Ensure all prerequisites are installed
3. Verify your Supabase project is linked: `supabase status`
4. Check environment variables are set properly

## Production Secrets

The script sets development secrets by default. For production, update these in your Supabase dashboard:

- `CRON_SECRET` - Secure token for cron jobs
- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app secret
- `TICKETMASTER_API_KEY` - Your Ticketmaster API key
- `SETLISTFM_API_KEY` - Your Setlist.fm API key

---

🎉 **That's it!** One command deploys everything and gets TheSet ready for production!