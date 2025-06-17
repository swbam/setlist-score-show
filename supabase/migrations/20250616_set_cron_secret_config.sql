-- This migration sets up configuration for cron jobs
-- The CRON_SECRET should be set as an environment variable in your Supabase project

-- Create a configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a placeholder for the CRON_SECRET
-- This should be updated with your actual secret via Supabase dashboard
INSERT INTO app_config (key, value, description)
VALUES (
  'cron_secret_hint',
  'Set CRON_SECRET in Edge Functions environment variables',
  'The CRON_SECRET should be set as an environment variable in Supabase Dashboard > Settings > Edge Functions'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

-- Create a function to get the cron secret (for internal use only)
-- This function should only be accessible by service role
CREATE OR REPLACE FUNCTION get_cron_auth_header()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In production, this would retrieve the secret from vault or environment
  -- For now, return a placeholder that indicates the secret needs to be set
  RETURN 'Bearer ' || current_setting('app.settings.cron_secret', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Bearer YOUR_CRON_SECRET_HERE';
END;
$$;

-- Grant execute permission only to service role
REVOKE ALL ON FUNCTION get_cron_auth_header() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_cron_auth_header() TO service_role;