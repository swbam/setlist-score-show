-- Function to update venue location using PostGIS
CREATE OR REPLACE FUNCTION update_venue_location(venue_id UUID, lat FLOAT, lng FLOAT)
RETURNS void AS $$
BEGIN
  UPDATE venues 
  SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  WHERE id = venue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get homepage content optimized
CREATE OR REPLACE FUNCTION get_homepage_content()
RETURNS TABLE (
  top_artists JSONB,
  top_shows JSONB,
  featured_tours JSONB
) AS $$
DECLARE
  v_top_artists JSONB;
  v_top_shows JSONB;
  v_featured_tours JSONB;
BEGIN
  -- Check cache first
  SELECT data INTO v_top_artists
  FROM homepage_cache
  WHERE cache_key = 'top_artists'
    AND expires_at > NOW()
  LIMIT 1;
  
  SELECT data INTO v_top_shows
  FROM homepage_cache
  WHERE cache_key = 'top_shows'
    AND expires_at > NOW()
  LIMIT 1;
  
  SELECT data INTO v_featured_tours
  FROM homepage_cache
  WHERE cache_key = 'featured_tours'
    AND expires_at > NOW()
  LIMIT 1;
  
  -- If any cache missing, refresh all
  IF v_top_artists IS NULL OR v_top_shows IS NULL OR v_featured_tours IS NULL THEN
    PERFORM refresh_homepage_cache();
    
    -- Re-fetch from cache
    SELECT data INTO v_top_artists
    FROM homepage_cache
    WHERE cache_key = 'top_artists'
    LIMIT 1;
    
    SELECT data INTO v_top_shows
    FROM homepage_cache
    WHERE cache_key = 'top_shows'
    LIMIT 1;
    
    SELECT data INTO v_featured_tours
    FROM homepage_cache
    WHERE cache_key = 'featured_tours'
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(v_top_artists, '[]'::jsonb),
    COALESCE(v_top_shows, '[]'::jsonb),
    COALESCE(v_featured_tours, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for homepage_cache
ALTER TABLE homepage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage cache"
  ON homepage_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage homepage cache"
  ON homepage_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add RLS policies for search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own search analytics"
  ON search_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert search analytics"
  ON search_analytics FOR INSERT
  WITH CHECK (true);

-- Add RLS policies for sync_state
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sync state"
  ON sync_state FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Anyone can read sync state"
  ON sync_state FOR SELECT
  USING (true);