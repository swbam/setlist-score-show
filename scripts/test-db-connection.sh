#!/bin/bash

# Test database connection
set -e

echo "🔍 Testing database connection..."

# Export the correct Supabase database URL
export DATABASE_URL="postgresql://postgres:G7C5c3EAjmGe8Ea3@db.ailrmwtahifvstpfhbgn.supabase.co:5432/postgres"

# Test connection with psql if available
if command -v psql &> /dev/null; then
  echo "Testing with psql..."
  psql "$DATABASE_URL" -c "SELECT version();" || echo "psql connection failed"
fi

# Test with Prisma
cd packages/database

echo "Testing with Prisma..."
npx prisma db execute --url "$DATABASE_URL" --file /dev/stdin <<EOF
SELECT current_database(), current_user, version();
EOF

echo "✅ Database connection test completed"