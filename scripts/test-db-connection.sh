#!/bin/bash

echo "Testing database connections..."

# Test different connection formats
echo "1. Testing with pooler (postgres.project)..."
PGPASSWORD=Bambseth1590 psql -h aws-0-us-west-1.pooler.supabase.com -p 5432 -U postgres.ailrmwtahifvstpfhbgn -d postgres -c "SELECT version();" 2>&1 | head -5

echo ""
echo "2. Testing direct connection..."
PGPASSWORD=Bambseth1590 psql -h db.ailrmwtahifvstpfhbgn.supabase.co -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1 | head -5

echo ""
echo "3. Testing with port 6543..."
PGPASSWORD=Bambseth1590 psql -h db.ailrmwtahifvstpfhbgn.supabase.co -p 6543 -U postgres -d postgres -c "SELECT version();" 2>&1 | head -5