#!/bin/bash

# Deploy enhanced edge functions for TheSet platform
# Run from project root: ./supabase/functions/deploy-enhanced.sh

echo "🚀 Deploying enhanced Supabase Edge Functions..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Deploy functions
echo "📦 Deploying sync-top-shows (enhanced)..."
supabase functions deploy sync-top-shows --project-ref ailrmwtahifvstpfhbgn

echo "📦 Deploying sync-top-shows-v2 (new version)..."
supabase functions deploy sync-top-shows-v2 --project-ref ailrmwtahifvstpfhbgn

echo "📦 Deploying sync-spotify-enhanced..."
supabase functions deploy sync-spotify-enhanced --project-ref ailrmwtahifvstpfhbgn

echo "📦 Deploying existing functions..."
supabase functions deploy refresh_trending_shows --project-ref ailrmwtahifvstpfhbgn
supabase functions deploy calculate-trending --project-ref ailrmwtahifvstpfhbgn
supabase functions deploy sync-setlists --project-ref ailrmwtahifvstpfhbgn
supabase functions deploy sync-artists --project-ref ailrmwtahifvstpfhbgn

echo "⚙️ Setting up function secrets..."
supabase secrets set --project-ref ailrmwtahifvstpfhbgn \
  TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b \
  SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43 \
  SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d \
  SETLIST_FM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL

echo "📅 Setting up cron jobs..."
# These would be set via Supabase dashboard or API calls
echo "Please set up the following cron jobs in Supabase Dashboard:"
echo "- sync-top-shows: 0 */2 * * * (every 2 hours)"
echo "- sync-spotify-enhanced: 0 */6 * * * (every 6 hours)"
echo "- refresh_trending_shows: */10 * * * * (every 10 minutes)"
echo "- calculate-trending: 0 */1 * * * (every hour)"

echo "✅ Enhanced edge functions deployed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Run database migrations: supabase db push"
echo "2. Test functions via Supabase Dashboard"
echo "3. Monitor function logs for any issues"
echo "4. Update frontend to use new data structures"