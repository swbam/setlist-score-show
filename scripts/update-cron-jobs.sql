-- Update cron jobs to use enhanced sync and refresh cache
-- Run this in Supabase SQL Editor

-- First, unschedule old jobs if they exist
SELECT cron.unschedule('sync-top-shows-job');
SELECT cron.unschedule('refresh-homepage-cache');

-- Schedule enhanced shows sync every 2 hours
SELECT cron.schedule(
  'sync-top-shows-enhanced',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows-enhanced',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule homepage cache refresh every 10 minutes
SELECT cron.schedule(
  'refresh-homepage-cache',
  '*/10 * * * *',
  'SELECT refresh_homepage_cache()'
);

-- Create sync state entries if they don't exist
INSERT INTO sync_state (job_name, status, last_sync_date)
VALUES 
  ('ticketmaster_shows_enhanced', 'idle', NOW() - INTERVAL '1 day'),
  ('homepage_cache_refresh', 'idle', NOW())
ON CONFLICT (job_name) DO NOTHING;