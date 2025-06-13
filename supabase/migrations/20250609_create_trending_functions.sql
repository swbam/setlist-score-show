-- Create function to get trending shows with artist limits
CREATE OR REPLACE FUNCTION get_trending_shows_limited(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  show_id UUID,
  date DATE,
  title TEXT,
  trending_score FLOAT,
  total_votes INTEGER,
  unique_voters INTEGER,
  artist_id UUID,
  artist_name TEXT,
  artist_slug TEXT,
  artist_image_url TEXT,
  venue_id UUID,
  venue_name TEXT,
  venue_city TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_shows AS (
    SELECT 
      ts.show_id,
      ts.date,
      ts.title,
      ts.trending_score,
      ts.total_votes::INTEGER,
      ts.unique_voters::INTEGER,
      s.artist_id,
      a.name as artist_name,
      a.slug as artist_slug,
      a.image_url as artist_image_url,
      s.venue_id,
      v.name as venue_name,
      v.city as venue_city,
      ROW_NUMBER() OVER (PARTITION BY s.artist_id ORDER BY ts.trending_score DESC) as rn
    FROM trending_shows_view ts
    JOIN shows s ON ts.show_id = s.id
    JOIN artists a ON s.artist_id = a.id
    JOIN venues v ON s.venue_id = v.id
    WHERE s.status = 'upcoming'
      AND s.date >= CURRENT_DATE
  )
  SELECT *
  FROM ranked_shows
  WHERE rn <= 2  -- Limit to max 2 shows per artist
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 