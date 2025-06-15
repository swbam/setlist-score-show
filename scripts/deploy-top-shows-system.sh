#!/bin/bash

# Deploy Top Shows System
# This script deploys the new sync-top-shows function and sets up the database

set -e

echo "🚀 Deploying Top Shows System..."

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

# Deploy the new sync-top-shows function
echo "Deploying sync-top-shows function..."
supabase functions deploy sync-top-shows

# Deploy other functions if needed
echo "Deploying other functions..."
supabase functions deploy sync-spotify
supabase functions deploy calculate-trending

cd ../..

echo "⏰ Step 3: Setting up cron jobs..."
echo "Please run the following SQL in your Supabase SQL editor:"
echo ""
echo "-- Enable pg_cron extension"
echo "CREATE EXTENSION IF NOT EXISTS pg_cron;"
echo ""
echo "-- Set up cron secret (replace with your actual secret)"
echo "ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret-here';"
echo ""
echo "-- Schedule sync-top-shows to run every hour"
echo "SELECT cron.schedule("
echo "  'sync-top-shows',"
echo "  '0 * * * *',"
echo "  \$\$"
echo "  SELECT"
echo "    net.http_post("
echo "      url := 'https://$(supabase projects list --output json | jq -r '.[0].id').supabase.co/functions/v1/sync-top-shows',"
echo "      headers := '{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer ' || current_setting('app.cron_secret') || '\"}'::jsonb"
echo "    ) as request_id;"
echo "  \$\$"
echo ");"
echo ""

echo "🧪 Step 4: Testing the function..."
echo "You can test the function manually with:"
echo "curl -X POST 'https://$(supabase projects list --output json | jq -r '.[0].id').supabase.co/functions/v1/sync-top-shows' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL commands above in your Supabase SQL editor"
echo "2. Set your CRON_SECRET environment variable in Supabase"
echo "3. Test the function manually"
echo "4. Monitor the logs to ensure it's working correctly"
echo ""
echo "🎉 Your top shows system is ready!" 