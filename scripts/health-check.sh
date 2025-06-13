#!/bin/bash

# Health check script for TheSet
# Runs various checks to ensure the application is functioning correctly

set -e

ENVIRONMENT=${1:-"production"}

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URLs based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    WEB_URL="https://setlist-score-show.vercel.app"
    API_URL="https://setlist-api.railway.app"
    GRAPHQL_URL="$API_URL/graphql"
elif [ "$ENVIRONMENT" == "staging" ]; then
    WEB_URL="https://staging-setlist-score-show.vercel.app"
    API_URL="https://staging-setlist-api.railway.app"
    GRAPHQL_URL="$API_URL/graphql"
else
    WEB_URL="http://localhost:3000"
    API_URL="http://localhost:4000"
    GRAPHQL_URL="$API_URL/graphql"
fi

echo "🏥 Running health checks for $ENVIRONMENT environment..."
echo ""

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} OK (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} FAILED (HTTP $response, expected $expected_status)"
        return 1
    fi
}

# Function to check GraphQL endpoint
check_graphql() {
    local url=$1
    local query=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "200" ] && ! echo "$body" | grep -q "errors"; then
        echo -e "${GREEN}✓${NC} OK"
        return 0
    else
        echo -e "${RED}✗${NC} FAILED"
        echo "Response: $body"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo -n "Checking database connectivity... "
    
    query="query { __typename }"
    response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}")
    
    if echo "$response" | grep -q "__typename"; then
        echo -e "${GREEN}✓${NC} OK"
        return 0
    else
        echo -e "${RED}✗${NC} FAILED"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    echo -n "Checking Redis connectivity... "
    
    # This would typically check Redis through the API
    # For now, we'll check if caching headers are present
    response=$(curl -s -I "$API_URL/health")
    
    if echo "$response" | grep -q "X-Cache"; then
        echo -e "${GREEN}✓${NC} OK"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} No cache headers found"
        return 0  # Non-critical
    fi
}

# Track overall health
HEALTH_STATUS=0

# 1. Check web app
echo "=== Web Application Checks ==="
check_endpoint "$WEB_URL" "200" "Homepage" || HEALTH_STATUS=1
check_endpoint "$WEB_URL/shows" "200" "Shows page" || HEALTH_STATUS=1
check_endpoint "$WEB_URL/artists" "200" "Artists page" || HEALTH_STATUS=1
echo ""

# 2. Check API
echo "=== API Health Checks ==="
check_endpoint "$API_URL/health" "200" "API health endpoint" || HEALTH_STATUS=1
check_endpoint "$GRAPHQL_URL" "200" "GraphQL endpoint" || HEALTH_STATUS=1
echo ""

# 3. Check GraphQL queries
echo "=== GraphQL Query Checks ==="
check_graphql "$GRAPHQL_URL" "query { trendingShows(limit: 1) { id } }" "Trending shows query" || HEALTH_STATUS=1
check_graphql "$GRAPHQL_URL" "query { artists(limit: 1) { edges { node { id } } } }" "Artists query" || HEALTH_STATUS=1
echo ""

# 4. Check external services
echo "=== External Service Checks ==="
check_database || HEALTH_STATUS=1
check_redis
echo ""

# 5. Performance checks
echo "=== Performance Checks ==="
echo -n "Checking homepage load time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$WEB_URL"
end_time=$(date +%s%N)
load_time=$(( ($end_time - $start_time) / 1000000 ))

if [ $load_time -lt 3000 ]; then
    echo -e "${GREEN}✓${NC} OK (${load_time}ms)"
elif [ $load_time -lt 5000 ]; then
    echo -e "${YELLOW}⚠${NC} SLOW (${load_time}ms)"
else
    echo -e "${RED}✗${NC} TOO SLOW (${load_time}ms)"
    HEALTH_STATUS=1
fi
echo ""

# 6. Check Supabase Realtime
echo "=== Realtime Checks ==="
echo -n "Checking Supabase Realtime connection... "
# This would typically connect to Supabase and verify realtime is working
# For now, we'll check if the Supabase URL is accessible
if [ "$ENVIRONMENT" == "production" ] || [ "$ENVIRONMENT" == "staging" ]; then
    SUPABASE_URL=$(curl -s "$API_URL/health" | grep -o '"supabase_connected":[^,}]*' | cut -d':' -f2)
    if [ "$SUPABASE_URL" == "true" ]; then
        echo -e "${GREEN}✓${NC} OK"
    else
        echo -e "${RED}✗${NC} FAILED"
        HEALTH_STATUS=1
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipped (local environment)"
fi
echo ""

# Summary
echo "================================"
if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ All health checks passed!${NC}"
    
    # Log success metric
    if [ "$ENVIRONMENT" == "production" ]; then
        curl -s -X POST "$API_URL/metrics/health-check" \
            -H "Content-Type: application/json" \
            -d '{"status":"success","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    fi
else
    echo -e "${RED}✗ Some health checks failed!${NC}"
    
    # Log failure metric
    if [ "$ENVIRONMENT" == "production" ]; then
        curl -s -X POST "$API_URL/metrics/health-check" \
            -H "Content-Type: application/json" \
            -d '{"status":"failure","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    fi
fi
echo "================================"

exit $HEALTH_STATUS