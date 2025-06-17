#!/bin/bash

# Test the sync-top-shows edge function locally

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not set in environment"
  exit 1
fi

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
  echo "Error: SUPABASE_URL not set in environment"
  exit 1
fi

echo "🚀 Testing sync-top-shows edge function..."
echo "URL: ${SUPABASE_URL}/functions/v1/sync-top-shows"

# Call the edge function
response=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/sync-top-shows" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json")

# Check if response is valid JSON
if echo "$response" | jq . >/dev/null 2>&1; then
  echo "✅ Response received:"
  echo "$response" | jq .
  
  # Check if successful
  success=$(echo "$response" | jq -r '.success')
  if [ "$success" = "true" ]; then
    echo "✅ Sync completed successfully!"
    echo "Stats:"
    echo "$response" | jq '.stats'
  else
    echo "❌ Sync failed"
    echo "Error: $(echo "$response" | jq -r '.error // .message')"
  fi
else
  echo "❌ Invalid response received:"
  echo "$response"
fi