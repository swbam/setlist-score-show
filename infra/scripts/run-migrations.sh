#!/bin/bash

# Run database migrations script
set -e

echo "🚀 Starting database migration process..."

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Navigate to database package
cd packages/database

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate deploy

# Refresh materialized views
echo "🔄 Refreshing materialized views..."
pnpm prisma db execute --file=../../scripts/refresh-views.sql

# Seed initial data if in development
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database..."
  pnpm prisma db seed
fi

echo "✅ Database migration completed successfully!"