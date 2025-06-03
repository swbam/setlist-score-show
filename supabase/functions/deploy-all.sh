#!/bin/bash

# Deploy all Supabase Edge Functions

echo "🚀 Deploying all Edge Functions..."

# Check if we're linked to a project
if ! supabase status >/dev/null 2>&1; then
  echo "❌ Not linked to a Supabase project. Run 'supabase link' first."
  exit 1
fi

functions=(
  "sync-setlists"
  "sync-spotify"
  "calculate-trending"
  "sync-artists"
  "cleanup-old-data"
)

for func in "${functions[@]}"
do
  echo "📦 Deploying $func..."
  
  # Deploy with --no-verify-jwt flag for cron functions
  supabase functions deploy $func --no-verify-jwt
  
  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
    # Continue with other functions instead of exiting
  fi
  
  echo ""
done

echo "🎉 Deployment process completed!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment secrets:"
echo "   supabase secrets set CRON_SECRET=1234567890"
echo "   supabase secrets set SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43"
echo "   supabase secrets set SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d"
echo "   supabase secrets set TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b"
echo "   supabase secrets set SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL"
echo ""
echo "2. Configure cron schedules in Supabase Dashboard"
echo "3. Test each function to ensure proper configuration"