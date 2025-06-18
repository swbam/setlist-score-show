-- Create sync state table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT UNIQUE NOT NULL,
  last_sync_date TIMESTAMPTZ,
  last_cursor TEXT,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role can manage sync state"
  ON sync_state FOR ALL
  USING (true);

CREATE POLICY "Anyone can read sync state"
  ON sync_state FOR SELECT
  USING (true);

-- Add initial sync state entries
INSERT INTO sync_state (job_name, status, last_sync_date)
VALUES 
  ('ticketmaster_shows_enhanced', 'idle', NOW() - INTERVAL '1 day'),
  ('homepage_cache_refresh', 'idle', NOW())
ON CONFLICT (job_name) DO NOTHING;

-- Create function to update venue location if missing
CREATE OR REPLACE FUNCTION update_venue_location(venue_id UUID, lat FLOAT, lng FLOAT)
RETURNS void AS $$
BEGIN
  UPDATE venues 
  SET latitude = lat, longitude = lng
  WHERE id = venue_id;
END;
$$ LANGUAGE plpgsql;

-- Create simple initial setlist function
CREATE OR REPLACE FUNCTION create_initial_setlist_for_show(p_show_id UUID)
RETURNS UUID AS $$
DECLARE
  v_setlist_id UUID;
  v_artist_id UUID;
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
  INSERT INTO setlists (show_id, name, order_index)
  VALUES (p_show_id, 'Main Set', 0)
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