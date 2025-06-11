#!/bin/bash

# Run migrations on Supabase

DATABASE_URL="postgresql://postgres.ailrmwtahifvstpfhbgn:Bambseth1590@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

echo "Running migrations..."

# Run each migration
for migration in supabase/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $migration"
    psql "$DATABASE_URL" -f "$migration"
  fi
done

echo "Migrations complete!"