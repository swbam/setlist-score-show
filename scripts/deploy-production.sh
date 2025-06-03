#!/bin/bash

# Production deployment script for Setlist Score Show
# This script handles the full deployment process with safety checks

set -e # Exit on error

echo "🚀 Starting production deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "You must be on the main branch to deploy to production"
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_error "You have uncommitted changes. Please commit or stash them before deploying."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from origin..."
git pull origin main

# Run tests
print_status "Running tests..."
pnpm test
if [ $? -ne 0 ]; then
    print_error "Tests failed. Aborting deployment."
    exit 1
fi

# Run type checking
print_status "Running type check..."
pnpm type-check
if [ $? -ne 0 ]; then
    print_error "Type checking failed. Aborting deployment."
    exit 1
fi

# Build the project
print_status "Building the project..."
pnpm build
if [ $? -ne 0 ]; then
    print_error "Build failed. Aborting deployment."
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
pnpm db:migrate:deploy
if [ $? -ne 0 ]; then
    print_error "Database migration failed. Aborting deployment."
    exit 1
fi

# Tag the release
print_status "Creating release tag..."
VERSION=$(node -p "require('./package.json').version")
TAG_NAME="v${VERSION}-$(date +%Y%m%d-%H%M%S)"
git tag -a "$TAG_NAME" -m "Production deployment $TAG_NAME"
git push origin "$TAG_NAME"

# Deploy to Vercel (Web)
print_status "Deploying web app to Vercel..."
cd apps/web
vercel --prod --yes
cd ../..

# Deploy to Railway (API)
print_status "Deploying API to Railway..."
cd apps/api
railway up
cd ../..

# Run post-deployment checks
print_status "Running post-deployment health checks..."
./scripts/health-check.sh production

# Send deployment notification
print_status "Sending deployment notification..."
./scripts/notify-deployment.sh "$TAG_NAME" "production"

# Clear CDN cache
print_status "Clearing CDN cache..."
./scripts/clear-cache.sh

# Update status page
print_status "Updating status page..."
./scripts/update-status.sh "operational"

print_status "🎉 Production deployment completed successfully!"
echo ""
echo "Deployment summary:"
echo "  - Version: $VERSION"
echo "  - Tag: $TAG_NAME"
echo "  - Web URL: https://setlist-score-show.vercel.app"
echo "  - API URL: https://setlist-api.railway.app"
echo ""
print_warning "Remember to monitor the application for the next 30 minutes"