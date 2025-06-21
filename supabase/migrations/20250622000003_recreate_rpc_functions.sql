-- Recreate RPC functions for homepage data loading
-- Ensure these functions exist and have correct permissions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_trending_artists(INTEGER);
DROP FUNCTION IF EXISTS get_top_shows(INTEGER);

-- Function to get trending artists with show counts
CREATE OR REPLACE FUNCTION get_trending_artists(p_limit INTEGER DEFAULT 24)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  image_url TEXT,
  genres TEXT[],
  popularity INTEGER,
  followers INTEGER,
  upcoming_shows_count BIGINT,
  next_show_date DATE,
  tour_cities TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.image_url,
    a.genres,
    a.popularity,
    a.followers,
    COUNT(DISTINCT s.id) as upcoming_shows_count,
    MIN(s.date)::date as next_show_date,
    array_agg(DISTINCT v.city || ', ' || v.state) FILTER (WHERE v.city IS NOT NULL) as tour_cities
  FROM artists a
  LEFT JOIN shows s ON s.artist_id = a.id AND s.status = 'upcoming' AND s.date >= CURRENT_DATE
  LEFT JOIN venues v ON v.id = s.venue_id
  WHERE a.image_url IS NOT NULL
  GROUP BY a.id
  ORDER BY a.popularity DESC, upcoming_shows_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get top shows with engagement data
CREATE OR REPLACE FUNCTION get_top_shows(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  date DATE,
  ticketmaster_url TEXT,
  tickets_url TEXT,
  min_price DECIMAL,
  max_price DECIMAL,
  popularity INTEGER,
  artist JSONB,
  venue JSONB,
  total_votes BIGINT,
  songs_voted BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.date::date,
    s.ticketmaster_url,
    NULL::TEXT as tickets_url,
    NULL::DECIMAL as min_price,
    NULL::DECIMAL as max_price,
    a.popularity as popularity,
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
  ORDER BY total_votes DESC, a.popularity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to all users
GRANT EXECUTE ON FUNCTION get_trending_artists(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_shows(INTEGER) TO anon, authenticated;