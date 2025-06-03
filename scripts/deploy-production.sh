#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Check if all required environment variables are set
required_vars=(
  "VERCEL_TOKEN"
  "RAILWAY_TOKEN"
  "DATABASE_URL"
  "SUPABASE_PROJECT_ID"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: $var is not set"
    exit 1
  fi
done

# 1. Run tests
echo "🧪 Running tests..."
pnpm test

# 2. Build all packages
echo "📦 Building packages..."
pnpm build

# 3. Run database migrations
echo "🗄️  Running database migrations..."
pnpm --filter @setlist/database migrate:deploy

# 4. Deploy Supabase Edge Functions
echo "⚡ Deploying Edge Functions..."
cd supabase/functions
./deploy-all.sh
cd ../..

# 5. Deploy API to Railway
echo "🚂 Deploying API to Railway..."
railway up --service api

# 6. Deploy Web to Vercel
echo "▲ Deploying Web to Vercel..."
cd apps/web
vercel --prod --token=$VERCEL_TOKEN
cd ../..

# 7. Refresh CDN cache
if [ ! -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "🌐 Purging CDN cache..."
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
fi

# 8. Run post-deployment checks
echo "✅ Running health checks..."
./scripts/health-check.sh

echo "🎉 Deployment completed successfully!"

# Send notification (optional)
if [ ! -z "$SLACK_WEBHOOK" ]; then
  curl -X POST $SLACK_WEBHOOK \
    -H 'Content-type: application/json' \
    --data '{"text":"Production deployment completed successfully! 🚀"}'
fi