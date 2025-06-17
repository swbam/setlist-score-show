-- Drop existing cron jobs
SELECT cron.unschedule('sync-artists-job');
SELECT cron.unschedule('calculate-trending-job');
SELECT cron.unschedule('sync-setlists-job');
SELECT cron.unschedule('sync-spotify-job');
SELECT cron.unschedule('cleanup-old-data-job');

-- Note: The CRON_SECRET should be set as an environment variable in your Supabase project
-- Go to Dashboard > Settings > Edge Functions and add CRON_SECRET with a secure value

-- Re-create cron jobs with proper auth using a secret that should be stored in Supabase vault
-- First, store the CRON_SECRET in the vault (this should be done via Supabase dashboard)
-- Example: INSERT INTO vault.secrets (name, secret) VALUES ('CRON_SECRET', 'your-secure-secret-here');

-- Create cron jobs that will use the CRON_SECRET from environment
SELECT cron.schedule(
  'sync-artists-job',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-artists',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'calculate-trending-job', 
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'sync-setlists-job',
  '0 2 * * *', 
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-setlists',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'sync-spotify-job',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'sync-top-shows-job',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'cleanup-old-data-job',
  '0 4 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/cleanup-old-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Create a function to manually set the cron secret (run this manually with your secret)
-- SELECT set_config('app.settings.cron_secret', 'your-secure-secret-here', false);