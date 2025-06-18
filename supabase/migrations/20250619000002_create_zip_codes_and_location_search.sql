-- Create PostGIS extension for location queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create ZIP codes table
CREATE TABLE IF NOT EXISTS zip_codes (
  zip_code CHAR(5) PRIMARY KEY,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  timezone TEXT,
  county TEXT,
  population INTEGER
);

-- Create indexes for ZIP code queries
CREATE INDEX idx_zip_codes_city_state ON zip_codes(city, state);
CREATE INDEX idx_zip_codes_state ON zip_codes(state);

-- Add location column to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Update existing venues with location data
UPDATE venues 
SET location = ST_SetSRID(ST_MakePoint(
  CAST(longitude AS float), 
  CAST(latitude AS float)
), 4326)
WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Create spatial index
CREATE INDEX idx_venues_location ON venues USING GIST (location);

-- Function to find nearby shows
CREATE OR REPLACE FUNCTION get_nearby_shows(
  p_zip_code TEXT,
  p_radius_km INTEGER DEFAULT 160 -- ~100 miles
)
RETURNS TABLE (
  show_id UUID,
  show_name TEXT,
  show_date TIMESTAMPTZ,
  artist_id UUID,
  artist_name TEXT,
  artist_slug TEXT,
  artist_image TEXT,
  venue_id UUID,
  venue_name TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_capacity INTEGER,
  distance_km FLOAT,
  total_votes BIGINT
) AS $$
DECLARE
  v_lat DECIMAL;
  v_lng DECIMAL;
  v_location geography;
BEGIN
  -- Get coordinates for ZIP
  SELECT latitude, longitude 
  INTO v_lat, v_lng
  FROM zip_codes 
  WHERE zip_code = p_zip_code;
  
  IF v_lat IS NULL THEN
    RAISE EXCEPTION 'Invalid ZIP code: %', p_zip_code;
  END IF;
  
  v_location := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    s.id as show_id,
    s.title as show_name,
    s.date as show_date,
    a.id as artist_id,
    a.name as artist_name,
    a.slug as artist_slug,
    a.image_url as artist_image,
    v.id as venue_id,
    v.name as venue_name,
    v.city as venue_city,
    v.state as venue_state,
    v.capacity as venue_capacity,
    ST_Distance(v.location, v_location) / 1000 as distance_km,
    COALESCE(SUM(ss.vote_count), 0) as total_votes
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN setlists sl ON sl.show_id = s.id
  LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND v.location IS NOT NULL
    AND ST_DWithin(v.location, v_location, p_radius_km * 1000)
  GROUP BY s.id, a.id, v.id, v.location
  ORDER BY 
    v.capacity DESC NULLS LAST,
    distance_km ASC,
    s.date ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- RPC to create show/artist/venue if clicking from external source
CREATE OR REPLACE FUNCTION create_or_get_show(
  p_ticketmaster_id TEXT,
  p_artist_name TEXT,
  p_venue_name TEXT,
  p_show_date TIMESTAMPTZ,
  p_venue_city TEXT DEFAULT NULL,
  p_venue_state TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_artist_id UUID;
  v_venue_id UUID;
  v_show_id UUID;
BEGIN
  -- Get or create artist
  SELECT id INTO v_artist_id
  FROM artists
  WHERE ticketmaster_id = p_ticketmaster_id
    OR LOWER(name) = LOWER(p_artist_name);
  
  IF v_artist_id IS NULL THEN
    INSERT INTO artists (name, slug, needs_spotify_sync)
    VALUES (
      p_artist_name,
      LOWER(REGEXP_REPLACE(p_artist_name, '[^a-zA-Z0-9]+', '-', 'g')),
      true
    )
    RETURNING id INTO v_artist_id;
  END IF;
  
  -- Get or create venue
  SELECT id INTO v_venue_id
  FROM venues
  WHERE LOWER(name) = LOWER(p_venue_name)
    AND (city = p_venue_city OR p_venue_city IS NULL);
  
  IF v_venue_id IS NULL THEN
    INSERT INTO venues (name, city, state)
    VALUES (p_venue_name, p_venue_city, p_venue_state)
    RETURNING id INTO v_venue_id;
  END IF;
  
  -- Get or create show
  SELECT id INTO v_show_id
  FROM shows
  WHERE artist_id = v_artist_id
    AND venue_id = v_venue_id
    AND DATE(date) = DATE(p_show_date);
  
  IF v_show_id IS NULL THEN
    INSERT INTO shows (
      artist_id, 
      venue_id, 
      date, 
      title,
      status
    )
    VALUES (
      v_artist_id,
      v_venue_id,
      p_show_date,
      p_artist_name || ' at ' || p_venue_name,
      'upcoming'
    )
    RETURNING id INTO v_show_id;
    
    -- Create initial setlist
    PERFORM create_initial_setlist_for_show(v_show_id);
  END IF;
  
  RETURN v_show_id;
END;
$$ LANGUAGE plpgsql;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_type TEXT DEFAULT 'general', -- 'general', 'zip', 'artist'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_created ON search_analytics(created_at);
CREATE INDEX idx_search_analytics_user ON search_analytics(user_id);

-- Create sync state table for managing sync cursors
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT UNIQUE NOT NULL,
  last_sync_date TIMESTAMPTZ,
  last_cursor TEXT,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle', -- 'running', 'idle', 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add needs_spotify_sync flag to artists
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS needs_spotify_sync BOOLEAN DEFAULT false;

-- Add missing fields to shows table
ALTER TABLE shows
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sales_status TEXT,
ADD COLUMN IF NOT EXISTS presale_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onsale_date TIMESTAMPTZ;

-- Create index for artist search with pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Create function to create initial setlist for a show
CREATE OR REPLACE FUNCTION create_initial_setlist_for_show(p_show_id UUID)
RETURNS UUID AS $$
DECLARE
  v_setlist_id UUID;
  v_artist_id UUID;
  v_song_count INTEGER;
BEGIN
  -- Get artist_id from show
  SELECT artist_id INTO v_artist_id
  FROM shows
  WHERE id = p_show_id;
  
  -- Check if setlist already exists
  SELECT id INTO v_setlist_id
  FROM setlists
  WHERE show_id = p_show_id
  LIMIT 1;
  
  IF v_setlist_id IS NOT NULL THEN
    RETURN v_setlist_id;
  END IF;
  
  -- Create new setlist
  INSERT INTO setlists (show_id, created_by, is_official)
  VALUES (p_show_id, NULL, false)
  RETURNING id INTO v_setlist_id;
  
  -- Add 5 random popular songs from the artist
  INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
  SELECT 
    v_setlist_id,
    s.id,
    ROW_NUMBER() OVER (ORDER BY s.popularity DESC),
    0
  FROM songs s
  WHERE s.artist_id = v_artist_id
    AND s.popularity > 0
  ORDER BY s.popularity DESC
  LIMIT 5;
  
  RETURN v_setlist_id;
END;
$$ LANGUAGE plpgsql;