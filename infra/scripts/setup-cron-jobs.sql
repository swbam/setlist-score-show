-- Setup cron jobs for Supabase Edge Functions
-- This script should be run in the Supabase SQL editor

-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Sync setlists every 6 hours
SELECT cron.schedule(
  'sync-setlists',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-setlists',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Sync top shows every hour
SELECT cron.schedule(
  'sync-top-shows',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Sync Spotify data every 4 hours
SELECT cron.schedule(
  'sync-spotify',
  '0 */4 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Calculate trending shows every 2 hours
SELECT cron.schedule(
  'calculate-trending',
  '0 */2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Sync artists every 12 hours
SELECT cron.schedule(
  'sync-artists',
  '0 */12 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-artists',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Cleanup old data daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-data',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/cleanup-old-data',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
    ) as request_id;
  $$
);

-- MVP sync cron schedules
SELECT cron.schedule('tm-sync',  '*/60 * * * *', $$select edge.sync_top_shows()$$);
SELECT cron.schedule('spotify-sync',  '0 */6 * * *', $$select edge.sync_spotify()$$);
SELECT cron.schedule('setlists-sync', '0 4 * * *', $$select edge.sync_setlists()$$);

-- View all scheduled jobs
SELECT * FROM cron.job; 