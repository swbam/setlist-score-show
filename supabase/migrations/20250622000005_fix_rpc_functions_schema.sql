-- Fix RPC functions to match actual database schema
-- Drop and recreate with correct column references

DROP FUNCTION IF EXISTS get_top_shows(INTEGER);

-- Function to get top shows with engagement data (fixed schema)
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
GRANT EXECUTE ON FUNCTION get_top_shows(INTEGER) TO anon, authenticated;