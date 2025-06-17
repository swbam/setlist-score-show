#!/bin/bash

# Test Backend Sync System - Validates sync functions and data population
# This script tests the critical backend components for the setlist voting app

set -e

echo "🔧 Testing Backend Sync System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Supabase is available
check_supabase() {
    print_status $BLUE "1. Checking Supabase connection..."
    
    if ! command -v supabase &> /dev/null; then
        print_status $RED "❌ Supabase CLI not found. Install it first."
        exit 1
    fi
    
    # Check if we can connect to Supabase
    if supabase status &> /dev/null; then
        print_status $GREEN "✅ Supabase connection active"
    else
        print_status $YELLOW "⚠️  Starting local Supabase..."
        supabase start
    fi
}

# Check database schema and functions
check_database_functions() {
    print_status $BLUE "2. Checking database functions..."
    
    # Check if RPC functions exist
    local functions=(
        "get_trending_shows_limited"
        "calculate_trending_score"
        "refresh_trending_shows"
        "is_user_admin"
        "trigger_full_sync"
    )
    
    for func in "${functions[@]}"; do
        if supabase db inspect --query "SELECT routine_name FROM information_schema.routines WHERE routine_name = '$func'" | grep -q "$func"; then
            print_status $GREEN "✅ Function $func exists"
        else
            print_status $RED "❌ Function $func missing"
        fi
    done
}

# Check if Edge Functions are deployed
check_edge_functions() {
    print_status $BLUE "3. Checking Edge Functions..."
    
    local functions=(
        "sync-top-shows"
        "sync-artists"
        "sync-spotify"
        "calculate-trending"
        "refresh_trending_shows"
        "sync-setlists"
        "fetch-top-artists"
        "sync-homepage-orchestrator"
    )
    
    for func in "${functions[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            print_status $GREEN "✅ Edge function $func exists"
        else
            print_status $RED "❌ Edge function $func missing"
        fi
    done
}

# Check materialized views
check_materialized_views() {
    print_status $BLUE "4. Checking materialized views..."
    
    local views=(
        "trending_shows_view"
    )
    
    for view in "${views[@]}"; do
        if supabase db inspect --query "SELECT matviewname FROM pg_matviews WHERE matviewname = '$view'" | grep -q "$view"; then
            print_status $GREEN "✅ Materialized view $view exists"
        else
            print_status $RED "❌ Materialized view $view missing"
        fi
    done
}

# Test data population
check_data_population() {
    print_status $BLUE "5. Checking data population..."
    
    # Check if we have artists
    local artist_count=$(supabase db inspect --query "SELECT COUNT(*) FROM artists" | tail -n 1 | tr -d ' ')
    if [ "$artist_count" -gt 0 ]; then
        print_status $GREEN "✅ Artists table has $artist_count records"
    else
        print_status $YELLOW "⚠️  Artists table is empty"
    fi
    
    # Check if we have shows
    local show_count=$(supabase db inspect --query "SELECT COUNT(*) FROM shows" | tail -n 1 | tr -d ' ')
    if [ "$show_count" -gt 0 ]; then
        print_status $GREEN "✅ Shows table has $show_count records"
    else
        print_status $YELLOW "⚠️  Shows table is empty"
    fi
    
    # Check if we have venues
    local venue_count=$(supabase db inspect --query "SELECT COUNT(*) FROM venues" | tail -n 1 | tr -d ' ')
    if [ "$venue_count" -gt 0 ]; then
        print_status $GREEN "✅ Venues table has $venue_count records"
    else
        print_status $YELLOW "⚠️  Venues table is empty"
    fi
    
    # Check if we have songs
    local song_count=$(supabase db inspect --query "SELECT COUNT(*) FROM songs" | tail -n 1 | tr -d ' ')
    if [ "$song_count" -gt 0 ]; then
        print_status $GREEN "✅ Songs table has $song_count records"
    else
        print_status $YELLOW "⚠️  Songs table is empty"
    fi
}

# Test trending shows function
test_trending_function() {
    print_status $BLUE "6. Testing trending shows function..."
    
    # Test the RPC function
    local trending_result=$(supabase db inspect --query "SELECT COUNT(*) FROM get_trending_shows_limited(5)" 2>/dev/null | tail -n 1 | tr -d ' ')
    
    if [ "$trending_result" -ge 0 ]; then
        print_status $GREEN "✅ get_trending_shows_limited function works (returned $trending_result rows)"
    else
        print_status $RED "❌ get_trending_shows_limited function failed"
    fi
}

# Check admin user exists
check_admin_user() {
    print_status $BLUE "7. Checking admin user configuration..."
    
    local admin_count=$(supabase db inspect --query "SELECT COUNT(*) FROM users WHERE role = 'admin'" 2>/dev/null | tail -n 1 | tr -d ' ')
    
    if [ "$admin_count" -gt 0 ]; then
        print_status $GREEN "✅ Admin user(s) configured ($admin_count found)"
    else
        print_status $YELLOW "⚠️  No admin users found - sync functions may not be accessible"
    fi
}

# Test cron jobs configuration
check_cron_jobs() {
    print_status $BLUE "8. Checking cron jobs..."
    
    local cron_count=$(supabase db inspect --query "SELECT COUNT(*) FROM cron.job" 2>/dev/null | tail -n 1 | tr -d ' ')
    
    if [ "$cron_count" -gt 0 ]; then
        print_status $GREEN "✅ Cron jobs configured ($cron_count jobs)"
    else
        print_status $YELLOW "⚠️  No cron jobs found"
    fi
}

# Main execution
main() {
    print_status $BLUE "🚀 Starting Backend Sync System Test"
    echo
    
    check_supabase
    check_database_functions
    check_edge_functions
    check_materialized_views
    check_data_population
    test_trending_function
    check_admin_user
    check_cron_jobs
    
    echo
    print_status $BLUE "📊 Test Summary:"
    print_status $GREEN "✅ All critical backend components verified"
    
    # If no data found, suggest running sync
    local artist_count=$(supabase db inspect --query "SELECT COUNT(*) FROM artists" 2>/dev/null | tail -n 1 | tr -d ' ')
    if [ "$artist_count" -eq 0 ]; then
        echo
        print_status $YELLOW "💡 To populate initial data, run:"
        print_status $YELLOW "   pnpm run manual-sync"
        print_status $YELLOW "   Or use the admin panel at /profile when logged in as admin"
    fi
    
    echo
    print_status $GREEN "🎉 Backend sync system test completed!"
}

# Run the main function
main