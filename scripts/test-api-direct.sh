#!/bin/bash

echo "🧪 Direct API Test"

# Search for Coldplay
echo -e "\n1️⃣ Searching for Coldplay..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { search(input: { query: \"Coldplay\", types: [ARTIST], limit: 1 }) { artists { id name spotifyId ticketmasterId setlistfmMbid } } }"
  }' | jq .

echo -e "\n⏳ Waiting 3 seconds for initial sync..."
sleep 3

# Get artist by slug - this will trigger song/show sync
echo -e "\n2️⃣ Getting artist page (this triggers sync)..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { artistBySlug(slug: \"coldplay\") { id name shows { id title date venue { name city } } songs { id title } } }"
  }' | jq .

echo -e "\n⏳ Waiting 10 seconds for songs/shows to sync..."
sleep 10

# Get artist again to see synced data
echo -e "\n3️⃣ Getting artist page again (should have data now)..."
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { artistBySlug(slug: \"coldplay\") { id name shows { id title date venue { name city } } songs { id title album } } }"
  }' | jq .

# Check database directly
echo -e "\n4️⃣ Checking database directly..."
export DATABASE_URL="postgresql://postgres.ailrmwtahifvstpfhbgn:Bambseth1590@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
psql "$DATABASE_URL" -c "SELECT id, name, spotify_id, ticketmaster_id FROM artists WHERE name LIKE '%Coldplay%';"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as song_count FROM songs WHERE artist_id IN (SELECT id FROM artists WHERE name LIKE '%Coldplay%');"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as show_count FROM shows WHERE artist_id IN (SELECT id FROM artists WHERE name LIKE '%Coldplay%');"