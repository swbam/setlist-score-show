-- Update cron jobs to use enhanced edge functions
-- First unschedule existing jobs to avoid conflicts

SELECT cron.unschedule('sync-artists-job');
SELECT cron.unschedule('calculate-trending-job');
SELECT cron.unschedule('sync-setlists-job');
SELECT cron.unschedule('sync-spotify-job');
SELECT cron.unschedule('cleanup-old-data-job');
SELECT cron.unschedule('refresh-homepage-cache');

-- Schedule enhanced sync jobs with proper intervals
SELECT cron.schedule(
  'sync-top-shows-enhanced',
  '0 */2 * * *', -- Every 2 hours
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows-enhanced',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'sync-spotify-enhanced',
  '0 */4 * * *', -- Every 4 hours
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify-enhanced',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'calculate-trending-shows',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'refresh-homepage-cache-cron',
  '*/10 * * * *', -- Every 10 minutes  
  'SELECT refresh_homepage_cache()'
);

SELECT cron.schedule(
  'sync-setlists-daily',
  '0 1 * * *', -- Daily at 1 AM
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-setlists',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'cleanup-old-data-weekly',
  '0 3 * * 0', -- Weekly on Sunday at 3 AM
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/cleanup-old-data',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  $$
);

-- Schedule statistics refresh
SELECT cron.schedule(
  'refresh-statistics-daily',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT refresh_table_statistics()'
);

-- Create function to check sync status
CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS TABLE (
  job_name TEXT,
  status TEXT,
  last_sync_date TIMESTAMPTZ,
  records_processed INTEGER,
  records_created INTEGER,
  error_message TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.job_name,
    ss.status,
    ss.last_sync_date,
    ss.records_processed,
    ss.records_created,
    ss.error_message,
    ss.updated_at
  FROM sync_state ss
  ORDER BY ss.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get homepage metrics
CREATE OR REPLACE FUNCTION get_homepage_metrics()
RETURNS TABLE (
  total_artists BIGINT,
  total_shows BIGINT,
  upcoming_shows BIGINT,
  total_venues BIGINT,
  total_votes BIGINT,
  cache_entries BIGINT,
  last_cache_refresh TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM artists) as total_artists,
    (SELECT COUNT(*) FROM shows) as total_shows,
    (SELECT COUNT(*) FROM shows WHERE status = 'upcoming' AND date >= CURRENT_DATE) as upcoming_shows,
    (SELECT COUNT(*) FROM venues) as total_venues,
    (SELECT COUNT(*) FROM votes) as total_votes,
    (SELECT COUNT(*) FROM homepage_cache WHERE expires_at > NOW()) as cache_entries,
    (SELECT MAX(created_at) FROM homepage_cache) as last_cache_refresh;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION get_sync_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_homepage_metrics() TO anon, authenticated;

-- Create admin function to manually trigger syncs
CREATE OR REPLACE FUNCTION trigger_manual_sync(p_job_name TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_url TEXT;
BEGIN
  -- Determine the URL based on job name
  CASE p_job_name
    WHEN 'sync-top-shows' THEN
      v_url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-top-shows-enhanced';
    WHEN 'sync-spotify' THEN
      v_url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-spotify-enhanced';
    WHEN 'calculate-trending' THEN
      v_url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/calculate-trending';
    WHEN 'refresh-cache' THEN
      PERFORM refresh_homepage_cache();
      RETURN QUERY SELECT true, 'Homepage cache refreshed successfully';
      RETURN;
    ELSE
      RETURN QUERY SELECT false, 'Unknown job name: ' || p_job_name;
      RETURN;
  END CASE;
  
  -- Trigger the edge function
  PERFORM net.http_post(
    url := v_url,
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '", "Content-Type": "application/json"}'::jsonb
  );
  
  RETURN QUERY SELECT true, 'Sync job ' || p_job_name || ' triggered successfully';
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 'Error triggering sync: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only (admin function)
GRANT EXECUTE ON FUNCTION trigger_manual_sync(TEXT) TO service_role;