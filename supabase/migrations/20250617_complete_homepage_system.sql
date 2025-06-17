-- Add role field to users table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Create homepage shows view
CREATE OR REPLACE VIEW public.homepage_shows AS
SELECT 
  s.id,
  s.title as name,
  s.date,
  s.ticketmaster_url as image_url,
  s.ticketmaster_id,
  s.status,
  s.created_at,
  a.id as artist_id,
  a.name as artist_name,
  a.spotify_id,
  a.image_url as artist_images,
  a.genres,
  a.popularity,
  v.id as venue_id,
  v.name as venue_name,
  v.city,
  v.state,
  v.country,
  COALESCE(vote_counts.total_votes, 0) as total_votes
FROM shows s
INNER JOIN artists a ON s.artist_id = a.id
INNER JOIN venues v ON s.venue_id = v.id
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT vo.id) as total_votes
  FROM setlists sl
  JOIN setlist_songs ss ON sl.id = ss.setlist_id
  JOIN votes vo ON ss.id = vo.setlist_song_id
  WHERE sl.show_id = s.id
) vote_counts ON true
WHERE 
  s.date >= CURRENT_DATE
  AND s.status = 'upcoming'
  AND v.country IN ('United States', 'US', 'USA')
  AND a.popularity > 40;

-- Create homepage artists view
CREATE OR REPLACE VIEW public.homepage_artists AS
SELECT DISTINCT ON (a.id)
  a.id,
  a.name,
  a.spotify_id,
  a.image_url as images,
  a.genres,
  a.popularity,
  COUNT(DISTINCT s.id) as upcoming_shows
FROM artists a
INNER JOIN shows s ON s.artist_id = a.id
INNER JOIN venues v ON s.venue_id = v.id
WHERE 
  s.date >= CURRENT_DATE
  AND s.status = 'upcoming'
  AND v.country IN ('United States', 'US', 'USA')
  AND a.popularity > 50
GROUP BY a.id, a.name, a.spotify_id, a.image_url, a.genres, a.popularity
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY a.id, a.popularity DESC;

-- Create RPC for combined homepage content
CREATE OR REPLACE FUNCTION get_homepage_content(
  show_limit INT DEFAULT 24,
  artist_limit INT DEFAULT 12
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'shows', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT * FROM homepage_shows
        ORDER BY 
          date ASC,
          popularity DESC
        LIMIT show_limit
      ) s
    ),
    'artists', (
      SELECT json_agg(row_to_json(a))
      FROM (
        SELECT * FROM homepage_artists
        ORDER BY 
          upcoming_shows DESC,
          popularity DESC
        LIMIT artist_limit
      ) a
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create the missing get_trending_shows_limited function
CREATE OR REPLACE FUNCTION get_trending_shows_limited(
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  date date,
  artist_name text,
  artist_id uuid,
  venue_name text,
  venue_id uuid,
  city text,
  state text,
  country text,
  total_votes bigint,
  popularity int,
  image_url text,
  spotify_id text,
  genres text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.date,
    a.name as artist_name,
    a.id as artist_id,
    v.name as venue_name,
    v.id as venue_id,
    v.city,
    v.state,
    v.country,
    COALESCE(vote_counts.total_votes, 0) as total_votes,
    a.popularity,
    a.image_url,
    a.spotify_id,
    a.genres
  FROM shows s
  INNER JOIN artists a ON s.artist_id = a.id
  INNER JOIN venues v ON s.venue_id = v.id
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT vo.id) as total_votes
    FROM setlists sl
    JOIN setlist_songs ss ON sl.id = ss.setlist_id
    JOIN votes vo ON ss.id = vo.setlist_song_id
    WHERE sl.show_id = s.id
  ) vote_counts ON true
  WHERE 
    s.date >= CURRENT_DATE
    AND s.status = 'upcoming'
    AND v.country IN ('United States', 'US', 'USA')
    AND a.popularity > 30
  ORDER BY 
    vote_counts.total_votes DESC NULLS LAST,
    a.popularity DESC,
    s.date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON homepage_shows TO authenticated;
GRANT SELECT ON homepage_artists TO authenticated;
GRANT EXECUTE ON FUNCTION get_homepage_content(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_shows_limited(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;