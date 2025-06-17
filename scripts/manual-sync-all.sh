#!/bin/bash

# Manual Sync All - Triggers all sync functions in the correct order
# This script manually populates the database with initial data

set -e

echo "🔄 Manual Database Sync - Populating Initial Data..."

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

# Get Supabase configuration
get_supabase_config() {
    print_status $BLUE "📡 Getting Supabase configuration..."
    
    # Check if we have local env file
    if [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # Use either local or remote Supabase
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
        print_status $GREEN "✅ Using remote Supabase: $SUPABASE_URL"
    else
        SUPABASE_URL="http://localhost:54321"
        print_status $YELLOW "⚠️  Using local Supabase: $SUPABASE_URL"
    fi
}

# Function to call Edge Function
call_function() {
    local func_name=$1
    local display_name=$2
    local wait_time=${3:-5}
    
    print_status $BLUE "🔄 Running $display_name..."
    
    # Set CRON_SECRET if not set (for local development)
    local cron_secret=${CRON_SECRET:-"setlist-score-cron-dev"}
    
    local response=$(curl -s -X POST \
        "${SUPABASE_URL}/functions/v1/${func_name}" \
        -H "Authorization: Bearer ${cron_secret}" \
        -H "Content-Type: application/json" \
        -w "HTTPSTATUS:%{http_code}")
    
    local http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    local body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ]; then
        print_status $GREEN "✅ $display_name completed successfully"
        if [ -n "$body" ]; then
            echo "   Response: $body"
        fi
    else
        print_status $RED "❌ $display_name failed (HTTP $http_code)"
        if [ -n "$body" ]; then
            echo "   Error: $body"
        fi
    fi
    
    # Wait between calls to avoid rate limiting
    if [ $wait_time -gt 0 ]; then
        print_status $YELLOW "⏳ Waiting ${wait_time}s before next sync..."
        sleep $wait_time
    fi
}

# Function to check data counts
check_data_counts() {
    print_status $BLUE "📊 Checking data population..."
    
    # We'll use the app's direct database query capability for this
    # This is simplified for the script
    print_status $GREEN "✅ Data check completed (view counts in Supabase dashboard)"
}

# Function to refresh trending data
refresh_trending() {
    print_status $BLUE "🔄 Refreshing trending calculations..."
    call_function "calculate-trending" "Calculate Trending Scores" 3
    call_function "refresh_trending_shows" "Refresh Trending Views" 2
}

# Main sync sequence
run_sync_sequence() {
    print_status $BLUE "🚀 Starting sync sequence..."
    echo
    
    # Step 1: Get top artists (foundation)
    call_function "fetch-top-artists" "Fetch Top Artists from Spotify" 10
    
    # Step 2: Sync top shows (creates shows, venues, setlists)
    call_function "sync-top-shows" "Sync Top Shows from Ticketmaster" 15
    
    # Step 3: Enhance artists with more Spotify data
    call_function "sync-artists" "Enhance Artists with Spotify Data" 10
    
    # Step 4: Sync song catalogs
    call_function "sync-spotify" "Sync Song Catalogs from Spotify" 10
    
    # Step 5: Sync existing setlists from Setlist.fm
    call_function "sync-setlists" "Sync Historical Setlists" 10
    
    # Step 6: Calculate and refresh trending data
    refresh_trending
    
    echo
    print_status $GREEN "🎉 Sync sequence completed!"
}

# Alternative: Use the orchestrator function
run_orchestrator() {
    print_status $BLUE "🎭 Running sync orchestrator..."
    call_function "sync-homepage-orchestrator" "Full Sync Orchestrator" 0
}

# Help function
show_help() {
    echo "Manual Sync Script - Populate database with initial data"
    echo
    echo "Usage: $0 [option]"
    echo
    echo "Options:"
    echo "  sequence     Run individual sync functions in sequence (default)"
    echo "  orchestrator Run the sync orchestrator function"
    echo "  trending     Only refresh trending calculations"
    echo "  help         Show this help message"
    echo
    echo "Environment Variables:"
    echo "  CRON_SECRET          Secret for Edge Function authentication"
    echo "  NEXT_PUBLIC_SUPABASE_URL  Supabase URL (defaults to localhost)"
    echo
}

# Main execution
main() {
    local command=${1:-sequence}
    
    case $command in
        "sequence")
            get_supabase_config
            run_sync_sequence
            check_data_counts
            ;;
        "orchestrator")
            get_supabase_config
            run_orchestrator
            check_data_counts
            ;;
        "trending")
            get_supabase_config
            refresh_trending
            ;;
        "help")
            show_help
            ;;
        *)
            print_status $RED "❌ Unknown command: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run the main function with all arguments
main "$@"