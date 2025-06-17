-- Complete Backend Sync System Setup
-- This migration ensures all components are properly configured

-- Ensure all required permissions are granted
GRANT SELECT ON trending_shows_view TO anon, authenticated;
GRANT SELECT ON trending_shows TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_shows_limited TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_trending_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_trending_shows TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_full_sync TO service_role;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_shows_status_date ON shows(status, date) WHERE status = 'upcoming';
CREATE INDEX IF NOT EXISTS idx_shows_artist_date ON shows(artist_id, date);
CREATE INDEX IF NOT EXISTS idx_votes_setlist_song ON votes(setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_created ON votes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes ON setlist_songs(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_artists_popularity ON artists(popularity DESC);
CREATE INDEX IF NOT EXISTS idx_songs_artist_popularity ON songs(artist_id, popularity DESC);

-- Create a view for easier homepage data access
CREATE OR REPLACE VIEW homepage_trending_shows AS
SELECT 
  ts.show_id,
  ts.date,
  ts.title,
  ts.trending_score,
  ts.total_votes,
  ts.unique_voters,
  ts.artist_id,
  ts.artist_name,
  ts.artist_slug,
  ts.artist_image_url,
  ts.venue_id,
  ts.venue_name,
  ts.venue_city
FROM get_trending_shows_limited(20) ts
ORDER BY ts.trending_score DESC;

-- Grant access to the homepage view
GRANT SELECT ON homepage_trending_shows TO anon, authenticated;

-- Create a function to get basic stats for the homepage
CREATE OR REPLACE FUNCTION get_homepage_stats()
RETURNS TABLE (
  total_artists INTEGER,
  total_shows INTEGER,
  total_votes INTEGER,
  upcoming_shows INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM artists) as total_artists,
    (SELECT COUNT(*)::INTEGER FROM shows) as total_shows,
    (SELECT COUNT(*)::INTEGER FROM votes) as total_votes,
    (SELECT COUNT(*)::INTEGER FROM shows WHERE status = 'upcoming' AND date >= CURRENT_DATE) as upcoming_shows;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on stats function
GRANT EXECUTE ON FUNCTION get_homepage_stats TO anon, authenticated;

-- Create a function to check if data population is needed
CREATE OR REPLACE FUNCTION needs_data_population()
RETURNS BOOLEAN AS $$
DECLARE
  artist_count INTEGER;
  show_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO artist_count FROM artists;
  SELECT COUNT(*) INTO show_count FROM shows WHERE status = 'upcoming';
  
  -- Return true if we have less than 5 artists or less than 10 upcoming shows
  RETURN (artist_count < 5 OR show_count < 10);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION needs_data_population TO anon, authenticated;

-- Create a function for admin health check
CREATE OR REPLACE FUNCTION admin_health_check()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  count_value INTEGER,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Artists'::TEXT as component,
    CASE WHEN COUNT(*) > 0 THEN 'OK'::TEXT ELSE 'EMPTY'::TEXT END as status,
    COUNT(*)::INTEGER as count_value,
    CASE WHEN COUNT(*) > 0 THEN 'Artists loaded'::TEXT ELSE 'Run sync-top-shows or fetch-top-artists'::TEXT END as message
  FROM artists
  
  UNION ALL
  
  SELECT 
    'Shows'::TEXT as component,
    CASE WHEN COUNT(*) > 0 THEN 'OK'::TEXT ELSE 'EMPTY'::TEXT END as status,
    COUNT(*)::INTEGER as count_value,
    CASE WHEN COUNT(*) > 0 THEN 'Shows loaded'::TEXT ELSE 'Run sync-top-shows'::TEXT END as message
  FROM shows WHERE status = 'upcoming'
  
  UNION ALL
  
  SELECT 
    'Songs'::TEXT as component,
    CASE WHEN COUNT(*) > 0 THEN 'OK'::TEXT ELSE 'EMPTY'::TEXT END as status,
    COUNT(*)::INTEGER as count_value,
    CASE WHEN COUNT(*) > 0 THEN 'Songs loaded'::TEXT ELSE 'Run sync-spotify'::TEXT END as message
  FROM songs
  
  UNION ALL
  
  SELECT 
    'Trending View'::TEXT as component,
    CASE WHEN COUNT(*) > 0 THEN 'OK'::TEXT ELSE 'EMPTY'::TEXT END as status,
    COUNT(*)::INTEGER as count_value,
    CASE WHEN COUNT(*) > 0 THEN 'Trending data available'::TEXT ELSE 'Run calculate-trending'::TEXT END as message
  FROM trending_shows_view
  
  UNION ALL
  
  SELECT 
    'Admin Users'::TEXT as component,
    CASE WHEN COUNT(*) > 0 THEN 'OK'::TEXT ELSE 'MISSING'::TEXT END as status,
    COUNT(*)::INTEGER as count_value,
    CASE WHEN COUNT(*) > 0 THEN 'Admin users configured'::TEXT ELSE 'Set user role to admin'::TEXT END as message
  FROM users WHERE role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admins can see health check)
GRANT EXECUTE ON FUNCTION admin_health_check TO authenticated;

-- Log completion
SELECT 'Backend sync system setup completed' as status;