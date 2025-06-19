#!/bin/bash

# TheSet Complete Deployment Script

echo "🚀 Starting TheSet Complete Deployment..."

# 1. Set environment variables
export SUPABASE_PROJECT_ID="ailrmwtahifvstpfhbgn"
export DATABASE_URL="postgresql://postgres.ailrmwtahifvstpfhbgn:Bambseth1590@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

# 2. Deploy all Edge Functions
echo "📦 Deploying Edge Functions..."
cd supabase/functions

for FUNCTION in sync-top-shows calculate-trending sync-spotify sync-setlists cleanup-old-data fetch-top-artists
do
  echo "Deploying $FUNCTION..."
  supabase functions deploy $FUNCTION --project-ref $SUPABASE_PROJECT_ID
done

cd ../..

# 3. Setup Cron Jobs
echo "⏰ Setting up Cron Jobs..."
cat > setup-cron.sql << 'EOF'
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clear existing schedules
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname IN (
  'sync-top-shows-hourly',
  'calculate-trending-2h',
  'sync-spotify-6h',
  'sync-setlists-daily',
  'cleanup-old-data-weekly'
);

-- Schedule sync-top-shows every hour
SELECT cron.schedule(
  'sync-top-shows-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule calculate-trending every 2 hours
SELECT cron.schedule(
  'calculate-trending-2h',
  '0 */2 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule sync-spotify every 6 hours
SELECT cron.schedule(
  'sync-spotify-6h',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA"}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule sync-setlists daily at 3 AM
SELECT cron.schedule(
  'sync-setlists-daily',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-setlists',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA"}'::jsonb
    ) AS request_id;
  $$
);

-- Show scheduled jobs
SELECT * FROM cron.job;
EOF

psql "$DATABASE_URL" -f setup-cron.sql

# 4. Create RLS Policies
echo "🔒 Setting up RLS Policies..."
cat > setup-rls.sql << 'EOF'
-- Enable RLS on tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artists ENABLE ROW LEVEL SECURITY;

-- Public read access for main tables
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlist_songs FOR SELECT USING (true);

-- User policies
CREATE POLICY "Users can read own profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
  FOR UPDATE USING (auth.uid() = id);

-- User artists policies
CREATE POLICY "Users can view own artists" ON user_artists 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own artists" ON user_artists 
  FOR ALL USING (auth.uid() = user_id);

-- Voting policies
CREATE POLICY "Users can view all votes" ON votes 
  FOR SELECT USING (true);

CREATE POLICY "Users can create own votes" ON votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON votes 
  FOR UPDATE USING (auth.uid() = user_id);
EOF

psql "$DATABASE_URL" -f setup-rls.sql

# 5. Run initial data sync
echo "🔄 Running initial data sync..."
curl -X POST https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw" \
  -H "Content-Type: application/json"

echo "⏳ Waiting for sync to complete..."
sleep 10

curl -X POST https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw" \
  -H "Content-Type: application/json"

# 6. Deploy to Vercel
echo "🌐 Deploying to Vercel..."
cd apps/web
vercel deploy --prod

echo "✅ Deployment Complete!"
echo ""
echo "📊 Next Steps:"
echo "1. Visit https://thesetclaude4.vercel.app/"
echo "2. Go to Admin Dashboard to import artists"
echo "3. Monitor sync status in Supabase Dashboard"
echo ""
echo "🔑 Admin Setup:"
echo "1. Create an admin user account"
echo "2. Update user role to 'admin' in Supabase:"
echo "   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';" 