#!/bin/bash

# Setup and Start Script for Setlist Score Show
echo "🎵 Starting Setlist Score Show setup and launch..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
if ! pnpm install; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Generate database client
print_status "Generating database client..."
if ! pnpm --filter @setlist/database generate; then
    print_error "Failed to generate database client"
    exit 1
fi
print_success "Database client generated"

# Build packages
print_status "Building packages..."
if ! pnpm build; then
    print_error "Build failed"
    exit 1
fi
print_success "Build completed"

# Check if sample data should be inserted
if [ "$1" = "--with-sample-data" ] || [ "$1" = "-s" ]; then
    print_status "Inserting sample data..."
    
    # Check if psql is available
    if command -v psql &> /dev/null; then
        # Use the DATABASE_URL from the API .env file
        if [ -f "apps/api/.env" ]; then
            source apps/api/.env
            if psql "$DATABASE_URL" -f scripts/insert-sample-data.sql > /dev/null 2>&1; then
                print_success "Sample data inserted successfully"
            else
                print_warning "Could not insert sample data - database might not be accessible or data might already exist"
            fi
        else
            print_warning "API .env file not found, skipping sample data insertion"
        fi
    else
        print_warning "psql not found, skipping sample data insertion"
        print_warning "You can run the sample data script manually later if needed"
    fi
fi

print_success "Setup completed! 🎉"
print_status "Starting development servers..."

# Start both servers in parallel
echo ""
print_status "🌐 Web app will be available at: http://localhost:3000"
print_status "🔗 GraphQL API will be available at: http://localhost:4000/graphql"
print_status "📊 API health check: http://localhost:4000/health"
echo ""
print_warning "Press Ctrl+C to stop all servers"
echo ""

# Start development servers
pnpm dev