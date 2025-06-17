-- Ensure CRON_SECRET environment variable is properly configured for Edge Functions
-- This migration sets up a secure default and instructions for proper configuration

-- Create a function to validate and set up CRON_SECRET configuration
CREATE OR REPLACE FUNCTION setup_cron_secret()
RETURNS TEXT AS $$
DECLARE
  current_setting_value TEXT;
  default_secret TEXT := 'setlist-score-cron-' || extract(epoch from now())::text;
BEGIN
  -- Try to get the current setting
  BEGIN
    current_setting_value := current_setting('app.settings.cron_secret', true);
  EXCEPTION WHEN OTHERS THEN
    current_setting_value := NULL;
  END;
  
  -- If no setting exists or it's the placeholder, set a secure default
  IF current_setting_value IS NULL OR current_setting_value = 'YOUR_CRON_SECRET_HERE' THEN
    -- Set a temporary default secret (should be changed in production)
    PERFORM set_config('app.settings.cron_secret', default_secret, false);
    
    -- Log a warning that this should be changed
    RAISE NOTICE 'CRON_SECRET has been set to a default value. Please update this in production!';
    RAISE NOTICE 'Run: SELECT set_config(''app.settings.cron_secret'', ''your-secure-secret'', false);';
    
    RETURN 'CRON_SECRET set to default: ' || default_secret;
  ELSE
    RETURN 'CRON_SECRET already configured';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the setup function
SELECT setup_cron_secret();

-- Drop the setup function as it's no longer needed
DROP FUNCTION setup_cron_secret();

-- Create missing cron jobs for the new functions
-- These were not included in the previous cron setup
SELECT cron.schedule(
  'fetch-top-artists-job',
  '0 0 * * 1',  -- Weekly on Monday
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/fetch-top-artists',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

SELECT cron.schedule(
  'sync-homepage-orchestrator-job',
  '0 5 * * *',  -- Daily at 5 AM
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/sync-homepage-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Add refresh_trending_shows to cron if not already scheduled
SELECT cron.schedule(
  'refresh-trending-shows-job',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/refresh_trending_shows',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);

-- Create a function to manually trigger all sync operations in the correct order
CREATE OR REPLACE FUNCTION trigger_full_sync()
RETURNS TEXT AS $$
DECLARE
  cron_secret TEXT;
  base_url TEXT := 'https://ailrmwtahifvstpfhbgn.supabase.co/functions/v1/';
  result TEXT := '';
BEGIN
  -- Get the cron secret
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  -- Log the sync start
  result := 'Starting full sync sequence...' || chr(10);
  
  -- Step 1: Fetch top artists (foundation data)
  PERFORM net.http_post(
    url := base_url || 'fetch-top-artists',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '1. Fetch top artists - requested' || chr(10);
  
  -- Step 2: Sync top shows (creates shows for those artists)
  PERFORM net.http_post(
    url := base_url || 'sync-top-shows',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '2. Sync top shows - requested' || chr(10);
  
  -- Step 3: Enhance artists with Spotify data
  PERFORM net.http_post(
    url := base_url || 'sync-artists',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '3. Sync artists - requested' || chr(10);
  
  -- Step 4: Sync Spotify song catalogs
  PERFORM net.http_post(
    url := base_url || 'sync-spotify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '4. Sync Spotify - requested' || chr(10);
  
  -- Step 5: Calculate trending scores
  PERFORM net.http_post(
    url := base_url || 'calculate-trending',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '5. Calculate trending - requested' || chr(10);
  
  -- Step 6: Refresh trending views
  PERFORM net.http_post(
    url := base_url || 'refresh_trending_shows',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || cron_secret,
      'Content-Type', 'application/json'
    )
  );
  result := result || '6. Refresh trending shows - requested' || chr(10);
  
  result := result || 'Full sync sequence initiated!';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role only
GRANT EXECUTE ON FUNCTION trigger_full_sync TO service_role;