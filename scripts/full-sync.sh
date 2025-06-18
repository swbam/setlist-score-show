#!/usr/bin/env bash
# Run full data sync pipeline: Ticketmaster shows, Spotify catalogues, Setlists, and homepage cache refresh.
# This script is designed to be self-contained and run from anywhere in the project.
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Hardcoded default credentials
DEFAULT_SUPABASE_URL="https://ailrmwtahifvstpfhbgn.supabase.co"
DEFAULT_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw"
DEFAULT_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA"
DEFAULT_CRON_SECRET="6155002300"

# Use environment variables if they exist, otherwise use the hardcoded defaults.
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-$DEFAULT_SUPABASE_URL}}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$DEFAULT_SUPABASE_ANON_KEY}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$DEFAULT_SUPABASE_SERVICE_ROLE_KEY}"
CRON_SECRET="${CRON_SECRET:-$DEFAULT_CRON_SECRET}"

# The primary token for authorization should be the service role key.
AUTH_TOKEN="$SUPABASE_SERVICE_ROLE_KEY"

# --- Sanity Checks ---
if [[ -z "$SUPABASE_URL" ]]; then echo "❌ SUPABASE_URL is not set. Exiting."; exit 1; fi
if [[ -z "$SUPABASE_ANON_KEY" ]]; then echo "❌ SUPABASE_ANON_KEY is not set. Exiting."; exit 1; fi
if [[ -z "$AUTH_TOKEN" ]]; then echo "❌ AUTH_TOKEN could not be determined. Exiting."; exit 1; fi
echo "✅ Credentials loaded."

CRON_HEADER=()
if [[ -n "$CRON_SECRET" ]]; then
  CRON_HEADER=(-H "x-cron-secret: $CRON_SECRET")
fi

EDGE_HEADERS=(-H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $AUTH_TOKEN")
RPC_HEADERS=(-H "apikey: $AUTH_TOKEN" -H "Authorization: Bearer $AUTH_TOKEN")

echo "Starting full data sync..."

call() {
  local url="$1"
  echo -e "\n➡️  $url"
  local response
  if [[ "$url" == */functions/v1/* ]]; then
    response=$(curl -s -X POST "$url" "${EDGE_HEADERS[@]}" "${CRON_HEADER[@]}")
  else
    response=$(curl -s -X POST "$url" "${RPC_HEADERS[@]}")
  fi
  echo "$response" | jq . 2>/dev/null || echo "$response"
}

call "$SUPABASE_URL/functions/v1/sync-top-shows-enhanced"
# call "$SUPABASE_URL/functions/v1/sync-spotify"
# sync-setlists may fail if rate-limited, so ignore failure but show output
call "$SUPABASE_URL/functions/v1/sync-setlists"
call "$SUPABASE_URL/rest/v1/rpc/refresh_homepage_cache"

echo -e "\n✅  Full sync finished" 