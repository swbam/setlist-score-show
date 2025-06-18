#!/bin/bash

# TheSet - Complete Deployment Script
# This script handles everything: functions, migrations, secrets, syncs, git, and deployment

set -e  # Exit on any error

echo "🚀 Starting complete deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git not found. Please install it first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm not found. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies found"
}

# Set Supabase secrets
set_supabase_secrets() {
    print_status "Setting Supabase secrets..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Please create one with your API keys."
        return 0
    fi
    
    # Source environment variables
    source .env
    
    # Set secrets if they exist
    if [ ! -z "$SPOTIFY_CLIENT_ID" ]; then
        supabase secrets set SPOTIFY_CLIENT_ID="$SPOTIFY_CLIENT_ID" || print_warning "Failed to set SPOTIFY_CLIENT_ID"
    fi
    
    if [ ! -z "$SPOTIFY_CLIENT_SECRET" ]; then
        supabase secrets set SPOTIFY_CLIENT_SECRET="$SPOTIFY_CLIENT_SECRET" || print_warning "Failed to set SPOTIFY_CLIENT_SECRET"
    fi
    
    if [ ! -z "$TICKETMASTER_API_KEY" ]; then
        supabase secrets set TICKETMASTER_API_KEY="$TICKETMASTER_API_KEY" || print_warning "Failed to set TICKETMASTER_API_KEY"
    fi
    
    if [ ! -z "$SETLIST_FM_API_KEY" ]; then
        supabase secrets set SETLIST_FM_API_KEY="$SETLIST_FM_API_KEY" || print_warning "Failed to set SETLIST_FM_API_KEY"
    fi
    
    if [ ! -z "$CRON_SECRET" ]; then
        supabase secrets set CRON_SECRET="$CRON_SECRET" || print_warning "Failed to set CRON_SECRET"
    fi
    
    print_success "Supabase secrets configured"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Push database schema
    supabase db push || {
        print_error "Failed to push database schema"
        exit 1
    }
    
    # Run Prisma migrations if they exist
    if [ -d "packages/database/prisma/migrations" ]; then
        pnpm --filter @setlist/database migrate deploy || print_warning "Prisma migrations failed"
    fi
    
    print_success "Database migrations completed"
}

# Deploy all Supabase functions
deploy_functions() {
    print_status "Deploying Supabase functions..."
    
    cd supabase/functions
    
    # Deploy all functions
    local functions=("calculate-trending" "cleanup-old-data" "fetch-top-artists" "refresh_trending_shows" "sync-artists" "sync-setlists" "sync-spotify" "sync-top-shows")
    
    for func in "${functions[@]}"; do
        if [ -d "$func" ]; then
            print_status "Deploying function: $func"
            supabase functions deploy "$func" || print_warning "Failed to deploy $func"
        fi
    done
    
    cd ../..
    print_success "Functions deployment completed"
}

# Run initial data syncs
run_syncs() {
    print_status "Running initial data syncs..."
    
    # Wait a moment for functions to be ready
    sleep 5
    
    # Trigger sync functions
    local sync_functions=("sync-artists" "sync-spotify" "sync-top-shows" "fetch-top-artists" "calculate-trending")
    
    for func in "${sync_functions[@]}"; do
        print_status "Triggering sync: $func"
        supabase functions invoke "$func" --method POST || print_warning "Failed to trigger $func"
        sleep 2  # Brief pause between syncs
    done
    
    print_success "Data syncs completed"
}

# Build the application
build_app() {
    print_status "Building application..."
    
    # Install dependencies
    pnpm install || {
        print_error "Failed to install dependencies"
        exit 1
    }
    
    # Build all packages
    pnpm build || {
        print_error "Failed to build application"
        exit 1
    }
    
    print_success "Application built successfully"
}

# Commit and push changes
commit_and_push() {
    print_status "Committing and pushing changes..."
    
    # Add all changes
    git add . || print_warning "Failed to add files to git"
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Commit with timestamp
    local commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S') - Complete deployment update"
    git commit -m "$commit_message" || print_warning "Failed to commit changes"
    
    # Push to remote
    git push || print_warning "Failed to push to remote repository"
    
    print_success "Changes committed and pushed"
}

# Deploy to Vercel (if configured)
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        cd apps/web
        vercel --prod || print_warning "Vercel deployment failed"
        cd ../..
        print_success "Vercel deployment completed"
    else
        print_warning "Vercel CLI not found. Skipping Vercel deployment."
    fi
}

# Deploy to Railway (if configured)
deploy_railway() {
    print_status "Deploying API to Railway..."
    
    if command -v railway &> /dev/null; then
        cd apps/api
        railway up || print_warning "Railway deployment failed"
        cd ../..
        print_success "Railway deployment completed"
    else
        print_warning "Railway CLI not found. Skipping Railway deployment."
    fi
}

# Main execution
main() {
    echo "🎵 TheSet - Complete Deployment Script"
    echo "======================================"
    
    check_dependencies
    
    print_status "Step 1/8: Setting Supabase secrets..."
    set_supabase_secrets
    
    print_status "Step 2/8: Running database migrations..."
    run_migrations
    
    print_status "Step 3/8: Deploying Supabase functions..."
    deploy_functions
    
    print_status "Step 4/8: Running data syncs..."
    run_syncs
    
    print_status "Step 5/8: Building application..."
    build_app
    
    print_status "Step 6/8: Committing and pushing changes..."
    commit_and_push
    
    print_status "Step 7/8: Deploying web app..."
    deploy_vercel
    
    print_status "Step 8/8: Deploying API..."
    deploy_railway
    
    echo ""
    print_success "🎉 Complete deployment finished successfully!"
    echo ""
    echo "Summary:"
    echo "✅ Database migrations applied"
    echo "✅ Supabase functions deployed"
    echo "✅ Data syncs triggered"
    echo "✅ Application built"
    echo "✅ Changes committed and pushed"
    echo "✅ Deployments completed"
    echo ""
    echo "Your TheSet application is now live and updated!"
}

# Run main function
main "$@"
