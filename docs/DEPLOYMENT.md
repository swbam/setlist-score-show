# TheSet - Complete Deployment Guide

## 🚀 One-Command Deployment

TheSet now includes a comprehensive deployment script that handles everything in one command:

```bash
pnpm updateall
```

This single command will:
1. ✅ Set Supabase secrets from your `.env` file
2. ✅ Run all database migrations
3. ✅ Deploy all Supabase functions
4. ✅ Trigger initial data syncs
5. ✅ Build the entire application
6. ✅ Commit and push all changes to git
7. ✅ Deploy web app to Vercel (if configured)
8. ✅ Deploy API to Railway (if configured)

## 📋 Prerequisites

Before running `pnpm updateall`, ensure you have:

### Required Tools
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) package manager
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Git](https://git-scm.com/)

### Optional Tools (for automatic deployment)
- [Vercel CLI](https://vercel.com/cli) - for web app deployment
- [Railway CLI](https://railway.app/cli) - for API deployment

### Environment Setup

1. **Create `.env` file** in the project root with your API keys:
```env
# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# API Keys
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
TICKETMASTER_API_KEY=your-ticketmaster-api-key
SETLIST_FM_API_KEY=your-setlistfm-api-key

# Security
CRON_SECRET=your-secure-random-string
```

2. **Initialize Supabase** (if not already done):
```bash
supabase login
supabase init
supabase link --project-ref your-project-ref
```

3. **Configure Git** (if not already done):
```bash
git remote add origin your-repository-url
```

## 🎯 Usage

### Full Deployment
```bash
pnpm updateall
```

### What Happens During Deployment

The script provides detailed, color-coded output showing progress:

```
🎵 TheSet - Complete Deployment Script
======================================
[INFO] Step 1/8: Setting Supabase secrets...
[SUCCESS] Supabase secrets configured
[INFO] Step 2/8: Running database migrations...
[SUCCESS] Database migrations completed
[INFO] Step 3/8: Deploying Supabase functions...
[SUCCESS] Functions deployment completed
[INFO] Step 4/8: Running data syncs...
[SUCCESS] Data syncs completed
[INFO] Step 5/8: Building application...
[SUCCESS] Application built successfully
[INFO] Step 6/8: Committing and pushing changes...
[SUCCESS] Changes committed and pushed
[INFO] Step 7/8: Deploying web app...
[SUCCESS] Vercel deployment completed
[INFO] Step 8/8: Deploying API...
[SUCCESS] Railway deployment completed

🎉 Complete deployment finished successfully!

Summary:
✅ Database migrations applied
✅ Supabase functions deployed
✅ Data syncs triggered
✅ Application built
✅ Changes committed and pushed
✅ Deployments completed

Your TheSet application is now live and updated!
```

## 🔧 Individual Commands

If you need to run specific parts of the deployment process:

### Database Operations
```bash
# Run migrations only
pnpm db:migrate:deploy

# Seed database
pnpm db:seed
```

### Function Management
```bash
# Deploy all functions manually
cd supabase/functions && ./deploy-all.sh
```

### Data Syncing
```bash
# Run specific syncs
pnpm refresh:trending
pnpm jobs:sync
```

### Building
```bash
# Build all packages
pnpm build

# Development mode
pnpm dev
```

## 🚨 Troubleshooting

### Common Issues

1. **Supabase CLI not authenticated**
   ```bash
   supabase login
   ```

2. **Missing environment variables**
   - Ensure `.env` file exists with all required variables
   - Check that variables are properly formatted (no spaces around `=`)

3. **Git push fails**
   - Ensure you have push permissions to the repository
   - Check if remote origin is set: `git remote -v`

4. **Function deployment fails**
   - Verify Supabase project is linked: `supabase status`
   - Check function code for syntax errors

5. **Build failures**
   - Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
   - Check for TypeScript errors: `pnpm type-check`

### Getting Help

If the deployment script fails:

1. **Check the colored output** - errors are shown in red with specific details
2. **Review logs** - each step shows detailed information about what went wrong
3. **Run individual commands** - isolate the failing step and run it manually
4. **Verify prerequisites** - ensure all required tools are installed and configured

## 🔄 Continuous Deployment

For automated deployments, you can:

1. **Set up GitHub Actions** to run `pnpm updateall` on push to main
2. **Use webhooks** to trigger deployments from external services
3. **Schedule regular deployments** using cron jobs

### Example GitHub Action

```yaml
name: Deploy TheSet
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm updateall
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          # Add other secrets as needed
```

## 📊 Monitoring

After deployment, monitor:

- **Supabase Dashboard** - Check function logs and database health
- **Vercel Dashboard** - Monitor web app performance and deployments
- **Railway Dashboard** - Check API health and logs
- **Application Logs** - Review sync job success/failure rates

## 🎉 Success!

Once `pnpm updateall` completes successfully, your TheSet application is fully deployed and ready for users!

The homepage will show:
- ✅ Top trending artists with upcoming shows
- ✅ Upcoming concerts with proper venue information
- ✅ Functional search for artists and locations
- ✅ Real-time voting capabilities
- ✅ Admin panel for manual sync triggers

Your concert setlist voting platform is now live! 🎵
