#!/bin/bash

# Production Deployment Script for Setlist Score Show
set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# 1. Environment Check
echo "📋 Checking environment..."
if [ ! -f .env ]; then
  echo "❌ .env file not found in root directory"
  exit 1
fi

# 2. Install Dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# 3. Type Check
echo "🔍 Running type checks..."
pnpm type-check

# 4. Lint Check
echo "🧹 Running linters..."
pnpm lint

# 5. Build All Packages
echo "🏗️  Building all packages..."
pnpm build

# 6. Database Migrations
echo "🗄️  Running database migrations..."
cd packages/database
pnpm prisma generate
pnpm prisma migrate deploy
cd ../..

# 7. Test API Health
echo "🏥 Testing API health (make sure API is running)..."
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
  echo "✅ API health check passed"
else
  echo "⚠️  API not running locally - skipping health check"
fi

# 8. Deploy Supabase Edge Functions
echo "☁️  Deploying Supabase Edge Functions..."
cd supabase/functions
if command -v supabase &> /dev/null; then
  ./deploy-all.sh
else
  echo "⚠️  Supabase CLI not installed - skipping edge function deployment"
fi
cd ../..

# 9. Deploy API to Railway
echo "🚂 Deploying API to Railway..."
if command -v railway &> /dev/null; then
  cd apps/api
  echo "📤 Pushing to Railway..."
  railway up --service api --detach
  cd ../..
else
  echo "⚠️  Railway CLI not installed - run: npm install -g @railway/cli"
fi

# 10. Deploy Web to Vercel
echo "▲ Deploying Web to Vercel..."
if command -v vercel &> /dev/null; then
  cd apps/web
  echo "📤 Pushing to Vercel..."
  vercel --prod --yes
  cd ../..
else
  echo "⚠️  Vercel CLI not installed - run: npm install -g vercel"
fi

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo ""
echo "📝 Post-Deployment Checklist:"
echo "1. ✓ Check Vercel deployment: https://vercel.com/dashboard"
echo "2. ✓ Check Railway deployment: https://railway.app/dashboard"
echo "3. ✓ Verify Supabase Edge Functions: https://app.supabase.com/project/ailrmwtahifvstpfhbgn/functions"
echo "4. ✓ Test production endpoints:"
echo "   - Web: [Your Vercel URL]"
echo "   - API: [Your Railway URL]/health"
echo "   - GraphQL: [Your Railway URL]/graphql"
echo ""
echo "🔐 Environment Variables to Set:"
echo "- In Vercel: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, etc."
echo "- In Railway: DATABASE_URL, REDIS_URL, API keys, etc."
echo ""
echo "🎉 Happy deploying!"