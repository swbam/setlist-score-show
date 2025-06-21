-- Fix permissions for populate_sample_data function
-- Allow anonymous and authenticated users to call this function for development

-- Grant execute permissions to all user types
GRANT EXECUTE ON FUNCTION populate_sample_data() TO anon, authenticated;