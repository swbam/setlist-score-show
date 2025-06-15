#!/bin/bash

# Deploy Admin Artist Import System
# This script deploys the new admin functionality for importing top artists

set -e

echo "🚀 Deploying Admin Artist Import System..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI is not installed"
  echo "Install it with: npm install -g supabase"
  exit 1
fi

# Check if we're logged in to Supabase
if ! supabase projects list &> /dev/null; then
  echo "❌ Error: Not logged in to Supabase"
  echo "Login with: supabase login"
  exit 1
fi

echo "📦 Step 1: Running database migrations..."
supabase db push

echo "🔧 Step 2: Deploying Edge Functions..."
cd supabase/functions

# Deploy the new fetch-top-artists function
echo "Deploying fetch-top-artists function..."
supabase functions deploy fetch-top-artists

# Ensure sync-top-shows is deployed
echo "Deploying sync-top-shows function..."
supabase functions deploy sync-top-shows

cd ../..

echo "🏗️ Step 3: Building web application..."
cd apps/web
npm run build
cd ../..

echo "✅ Deployment complete!"
echo ""
echo "📋 New Admin Features Available:"
echo "1. 🎯 Admin Dashboard: Enhanced with 'Sync Top Shows' button"
echo "2. 📥 Import Top Artists: New page at /admin/import-top-artists"
echo "3. 🔄 API Routes:"
echo "   - GET /api/admin/top-artists (fetch available artists)"
echo "   - POST /api/admin/import-artists (bulk import)"
echo "   - GET /api/cron/sync-top-shows (manual sync trigger)"
echo ""
echo "🎉 Admin system is ready!"
echo ""
echo "📖 Usage Instructions:"
echo "1. Go to /admin/dashboard"
echo "2. Click 'Sync Top Shows' to run hourly sync manually"
echo "3. Click 'Import Top Artists' to see and import new artists"
echo "4. Select artists and click 'Import Selected' to add them to your database"
echo ""
echo "🔧 Next Steps:"
echo "1. Set up the hourly cron job for sync-top-shows"
echo "2. Test the import functionality with a few artists"
echo "3. Monitor the logs to ensure everything works correctly" 