#!/bin/bash

# Script to run migrations on remote Supabase database
set -e

echo "🗄️  Running migrations on remote database..."

# Export the Supabase database URL
export DATABASE_URL="postgresql://postgres:G7C5c3EAjmGe8Ea3@db.ailrmwtahifvstpfhbgn.supabase.co:5432/postgres"

# Navigate to database package
cd packages/database

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Check migration status
echo "🔍 Checking migration status..."
pnpm prisma migrate status

# Deploy migrations
echo "🚀 Deploying migrations..."
pnpm prisma migrate deploy

# Verify the deployment
echo "✅ Verifying database schema..."
pnpm prisma db pull

echo "✨ Database migration completed successfully!"