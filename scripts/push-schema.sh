#!/bin/bash

# Push Prisma schema to Supabase
set -e

echo "🗄️  Pushing schema to Supabase..."

# Navigate to API directory where Prisma schema exists
cd apps/api

# Use the direct pooler URL for Supabase
export DATABASE_URL="postgres://postgres:Bambseth1590@db.ailrmwtahifvstpfhbgn.supabase.co:6543/postgres"

# Generate Prisma client
echo "📦 Generating Prisma client..."
pnpm prisma generate

# Push schema to database (creates tables if they don't exist)
echo "🚀 Pushing schema to database..."
pnpm prisma db push --skip-generate

echo "✅ Schema pushed successfully!"

# Show the current database status
echo "🔍 Current database status:"
pnpm prisma db pull --print

echo "✨ Done!"