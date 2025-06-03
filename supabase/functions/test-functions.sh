#!/bin/bash

# Test Supabase Edge Functions locally

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if SUPABASE_ANON_KEY is set
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_ANON_KEY environment variable is not set${NC}"
  echo "Please set it using: export SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

# Base URL for local functions
BASE_URL="http://localhost:54321/functions/v1"

echo -e "${YELLOW}🧪 Testing Supabase Edge Functions...${NC}"
echo ""

# Function to test an edge function
test_function() {
  local func_name=$1
  echo -e "${YELLOW}Testing $func_name...${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/$func_name" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json")
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ $func_name: Success (HTTP $http_code)${NC}"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "Response: $body"
  else
    echo -e "${RED}❌ $func_name: Failed (HTTP $http_code)${NC}"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "Response: $body"
  fi
  
  echo ""
}

# Test each function
functions=(
  "sync-setlists"
  "sync-spotify"
  "calculate-trending"  
  "sync-artists"
  "cleanup-old-data"
)

for func in "${functions[@]}"
do
  test_function "$func"
  sleep 1
done

echo -e "${GREEN}🎉 Testing complete!${NC}"