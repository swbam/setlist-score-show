-- This script sets up the homepage cache system
-- Run this in Supabase SQL Editor

-- Create homepage cache table
CREATE TABLE IF NOT EXISTS homepage_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_homepage_cache_key ON homepage_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_homepage_cache_expires ON homepage_cache(expires_at);

-- Enable RLS
ALTER TABLE homepage_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read homepage cache"
  ON homepage_cache FOR SELECT
  USING (true);

-- Function to get top artists for homepage
CREATE OR REPLACE FUNCTION get_top_artists_for_homepage()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(artist_data)
    FROM (
      SELECT 
        a.id,
        a.name,
        a.slug,
        a.image_url,
        a.genres,
        a.popularity,
        COUNT(DISTINCT s.id) as upcoming_shows_count,
        MIN(s.date) as next_show_date
      FROM artists a
      JOIN shows s ON s.artist_id = a.id
      JOIN venues v ON v.id = s.venue_id
      WHERE s.status = 'upcoming'
        AND s.date >= CURRENT_DATE
        AND s.date <= CURRENT_DATE + INTERVAL '90 days'
        AND a.image_url IS NOT NULL
      GROUP BY a.id
      ORDER BY a.popularity DESC, upcoming_shows_count DESC
      LIMIT 24
    ) artist_data
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get top shows for homepage
CREATE OR REPLACE FUNCTION get_top_shows_for_homepage()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(show_data)
    FROM (
      SELECT 
        s.id,
        s.title,
        s.date,
        s.tickets_url,
        jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'slug', a.slug,
          'image_url', a.image_url
        ) as artist,
        jsonb_build_object(
          'id', v.id,
          'name', v.name,
          'city', v.city,
          'state', v.state,
          'capacity', v.capacity
        ) as venue,
        COALESCE(SUM(ss.vote_count), 0) as total_votes,
        COUNT(DISTINCT ss.song_id) as songs_voted
      FROM shows s
      JOIN artists a ON a.id = s.artist_id
      JOIN venues v ON v.id = s.venue_id
      LEFT JOIN setlists sl ON sl.show_id = s.id
      LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
      WHERE s.status = 'upcoming'
        AND s.date >= CURRENT_DATE
        AND s.date <= CURRENT_DATE + INTERVAL '30 days'
      GROUP BY s.id, a.id, v.id
      ORDER BY total_votes DESC, s.popularity DESC
      LIMIT 20
    ) show_data
  );
END;
$$ LANGUAGE plpgsql;

-- Simplified refresh homepage cache function
CREATE OR REPLACE FUNCTION refresh_homepage_cache()
RETURNS void AS $$
BEGIN
  -- Top artists
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES (
    'top_artists',
    get_top_artists_for_homepage(),
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
  
  -- Top shows
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES (
    'top_shows',
    get_top_shows_for_homepage(),
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql;

-- Simplified get homepage content function
CREATE OR REPLACE FUNCTION get_homepage_content()
RETURNS TABLE (
  top_artists JSONB,
  top_shows JSONB
) AS $$
DECLARE
  v_top_artists JSONB;
  v_top_shows JSONB;
BEGIN
  -- Get from cache
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
  
  -- If cache miss, refresh
  IF v_top_artists IS NULL OR v_top_shows IS NULL THEN
    PERFORM refresh_homepage_cache();
    
    -- Re-fetch
    SELECT data INTO v_top_artists
    FROM homepage_cache
    WHERE cache_key = 'top_artists';
    
    SELECT data INTO v_top_shows
    FROM homepage_cache
    WHERE cache_key = 'top_shows';
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(v_top_artists, '[]'::jsonb),
    COALESCE(v_top_shows, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add missing columns to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS needs_spotify_sync BOOLEAN DEFAULT false;

-- Add missing columns to shows table
ALTER TABLE shows
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sales_status TEXT,
ADD COLUMN IF NOT EXISTS presale_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onsale_date TIMESTAMPTZ;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert search analytics"
  ON search_analytics FOR INSERT
  WITH CHECK (true);

-- Initial cache population
SELECT refresh_homepage_cache();