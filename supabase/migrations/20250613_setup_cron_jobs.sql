-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron jobs for Edge Functions
SELECT cron.schedule(
  'sync-artists-job',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-artists',
    headers := '{"Authorization": "Bearer 1234567890", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'calculate-trending-job', 
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending',
    headers := '{"Authorization": "Bearer 1234567890", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'sync-setlists-job',
  '0 2 * * *', 
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-setlists',
    headers := '{"Authorization": "Bearer 1234567890", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'sync-spotify-job',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify', 
    headers := '{"Authorization": "Bearer 1234567890", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'cleanup-old-data-job',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/cleanup-old-data',
    headers := '{"Authorization": "Bearer 1234567890", "Content-Type": "application/json"}'::jsonb
  );
  $$
); 