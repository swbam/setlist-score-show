#!/bin/bash

# Development startup script
set -e

echo "🚀 Starting development environment..."

# Check dependencies
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Run database migrations
echo "🗄️  Running database migrations..."
pnpm db:migrate

# Seed database in development
if [ "$NODE_ENV" = "development" ] || [ -z "$NODE_ENV" ]; then
    echo "🌱 Seeding database..."
    pnpm --filter @setlist/database seed
fi

# Start development servers
echo "🎯 Starting development servers..."
echo "📱 Web app will be available at: http://localhost:3000"
echo "🔧 API will be available at: http://localhost:4000"
echo "📊 GraphQL playground at: http://localhost:4000/graphql"
echo ""
echo "Press Ctrl+C to stop all services"

# Start Turbo dev
pnpm dev