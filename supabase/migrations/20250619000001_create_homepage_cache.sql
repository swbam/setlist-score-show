-- Create homepage cache table for fast loading
CREATE TABLE IF NOT EXISTS homepage_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create index for cache lookups
CREATE INDEX idx_homepage_cache_key ON homepage_cache(cache_key);
CREATE INDEX idx_homepage_cache_expires ON homepage_cache(expires_at);

-- Function to refresh homepage cache
CREATE OR REPLACE FUNCTION refresh_homepage_cache()
RETURNS void AS $$
BEGIN
  -- Top artists with upcoming shows
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES (
    'top_artists',
    (
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
          MIN(s.date) as next_show_date,
          array_agg(DISTINCT v.city || ', ' || v.state) FILTER (WHERE v.city IS NOT NULL) as tour_cities
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
    ),
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
  
  -- Top shows by engagement
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES (
    'top_shows',
    (
      SELECT jsonb_agg(show_data)
      FROM (
        SELECT 
          s.id,
          s.title,
          s.date,
          s.tickets_url,
          s.min_price,
          s.max_price,
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
          AND v.capacity > 1000
        GROUP BY s.id, a.id, v.id
        ORDER BY total_votes DESC, v.capacity DESC NULLS LAST
        LIMIT 20
      ) show_data
    ),
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
    
  -- Featured tours (artists with 3+ shows)
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES (
    'featured_tours',
    (
      SELECT jsonb_agg(tour_data)
      FROM (
        SELECT 
          a.id,
          a.name,
          a.slug,
          a.image_url,
          COUNT(DISTINCT s.id) as show_count,
          MIN(s.date) as tour_start,
          MAX(s.date) as tour_end,
          array_agg(DISTINCT v.city || ', ' || v.state ORDER BY s.date) as tour_stops
        FROM artists a
        JOIN shows s ON s.artist_id = a.id
        JOIN venues v ON v.id = s.venue_id
        WHERE s.status = 'upcoming'
          AND s.date >= CURRENT_DATE
          AND s.date <= CURRENT_DATE + INTERVAL '180 days'
        GROUP BY a.id
        HAVING COUNT(DISTINCT s.id) >= 3
        ORDER BY COUNT(DISTINCT s.id) DESC, a.popularity DESC
        LIMIT 8
      ) tour_data
    ),
    NOW() + INTERVAL '10 minutes'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh cache every 10 minutes via cron
SELECT cron.schedule(
  'refresh-homepage-cache',
  '*/10 * * * *',
  'SELECT refresh_homepage_cache()'
);

-- Initial cache population
SELECT refresh_homepage_cache();