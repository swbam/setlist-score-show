-- Final Implementation Fixes Migration
-- Ensures all missing functionality from the plan is implemented

-- Ensure role field exists in users table with proper default
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  -- Ensure any existing users without role get the default
  UPDATE users SET role = 'user' WHERE role IS NULL;
END $$;

-- Create or replace the automatic setlist creation function
CREATE OR REPLACE FUNCTION create_initial_setlist_for_show(
  show_id_param UUID,
  artist_id_param UUID
) RETURNS JSON AS $$
DECLARE
  setlist_id UUID;
  songs_data JSON;
  song_record RECORD;
  position_counter INT := 1;
BEGIN
  -- Create the main setlist
  INSERT INTO setlists (show_id, name, order_index, is_encore)
  VALUES (show_id_param, 'Main Set', 0, false)
  RETURNING id INTO setlist_id;

  -- Get artist's popular songs
  FOR song_record IN (
    SELECT id, title, popularity
    FROM songs 
    WHERE artist_id = artist_id_param 
    AND popularity >= 50
    ORDER BY popularity DESC
    LIMIT 15
  ) LOOP
    INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
    VALUES (setlist_id, song_record.id, position_counter, 0);
    position_counter := position_counter + 1;
  END LOOP;

  -- If we don't have enough songs, add more from any songs
  IF position_counter <= 10 THEN
    FOR song_record IN (
      SELECT id, title, popularity
      FROM songs 
      WHERE artist_id = artist_id_param 
      AND id NOT IN (
        SELECT song_id FROM setlist_songs WHERE setlist_id = setlist_id
      )
      ORDER BY popularity DESC
      LIMIT (15 - position_counter + 1)
    ) LOOP
      INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
      VALUES (setlist_id, song_record.id, position_counter, 0);
      position_counter := position_counter + 1;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'setlist_id', setlist_id,
    'songs_added', position_counter - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create setlists for new shows
CREATE OR REPLACE FUNCTION trigger_create_initial_setlist()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create setlist if the show is upcoming and doesn't already have setlists
  IF NEW.status = 'upcoming' AND NEW.date >= CURRENT_DATE THEN
    -- Check if setlists already exist
    IF NOT EXISTS (SELECT 1 FROM setlists WHERE show_id = NEW.id) THEN
      -- Create initial setlist in background
      PERFORM create_initial_setlist_for_show(NEW.id, NEW.artist_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS auto_create_setlist_trigger ON shows;
CREATE TRIGGER auto_create_setlist_trigger
  AFTER INSERT ON shows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_initial_setlist();

-- Enhanced homepage content function with proper error handling
CREATE OR REPLACE FUNCTION get_homepage_content_enhanced(
  show_limit INT DEFAULT 24,
  artist_limit INT DEFAULT 12
)
RETURNS JSON AS $$
DECLARE
  shows_result JSON;
  artists_result JSON;
  final_result JSON;
BEGIN
  -- Get shows with comprehensive data
  SELECT json_agg(row_to_json(t)) INTO shows_result
  FROM (
    SELECT 
      s.id,
      s.title as name,
      s.date,
      s.ticketmaster_url as image_url,
      s.ticketmaster_id,
      s.status,
      s.created_at,
      json_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug,
        'imageUrl', a.image_url
      ) as artist,
      json_build_object(
        'id', v.id,
        'name', v.name,
        'city', v.city,
        'state', v.state,
        'country', v.country
      ) as venue,
      COALESCE(vote_counts.total_votes, 0) as totalVotes,
      a.popularity as trendingScore
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
    LIMIT show_limit
  ) t;

  -- Get artists with comprehensive data
  SELECT json_agg(row_to_json(t)) INTO artists_result
  FROM (
    SELECT DISTINCT ON (a.id)
      a.id,
      a.name,
      a.slug,
      a.image_url,
      a.genres,
      a.popularity,
      a.followers,
      COUNT(DISTINCT s.id) as upcoming_shows
    FROM artists a
    INNER JOIN shows s ON s.artist_id = a.id
    INNER JOIN venues v ON s.venue_id = v.id
    WHERE 
      s.date >= CURRENT_DATE
      AND s.status = 'upcoming'
      AND v.country IN ('United States', 'US', 'USA')
      AND a.popularity > 40
      AND a.image_url IS NOT NULL
    GROUP BY a.id, a.name, a.slug, a.image_url, a.genres, a.popularity, a.followers
    HAVING COUNT(DISTINCT s.id) > 0
    ORDER BY a.id, COUNT(DISTINCT s.id) DESC, a.popularity DESC
    LIMIT artist_limit
  ) t;

  -- Build final result
  SELECT json_build_object(
    'shows', COALESCE(shows_result, '[]'::json),
    'artists', COALESCE(artists_result, '[]'::json)
  ) INTO final_result;
  
  RETURN final_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return empty results on error
    RETURN json_build_object(
      'shows', '[]'::json,
      'artists', '[]'::json,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION check_user_admin_status(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_id;
  RETURN COALESCE(user_role, 'user') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to promote user to admin (for initial setup)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE users 
  SET role = 'admin' 
  WHERE email = user_email;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper indexes exist for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_popularity ON artists(popularity DESC) WHERE popularity > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_songs_vote_count ON setlist_songs(vote_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_homepage_content_enhanced(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_initial_setlist_for_show(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_user_admin_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION promote_user_to_admin(TEXT) TO service_role;

-- Update existing RLS policies to work with new functions
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read public data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read shows" ON shows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read setlists" ON setlists
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read setlist_songs" ON setlist_songs
  FOR SELECT TO authenticated USING (true);

-- Allow users to read their own data and admins to read all
CREATE POLICY IF NOT EXISTS "Users can read own data, admins can read all" ON users
  FOR SELECT TO authenticated 
  USING (auth.uid() = id OR check_user_admin_status(auth.uid()));

-- Allow admins to update user roles
CREATE POLICY IF NOT EXISTS "Admins can update user data" ON users
  FOR UPDATE TO authenticated 
  USING (check_user_admin_status(auth.uid()));

COMMENT ON MIGRATION IS 'Final implementation fixes - ensures all plan functionality is implemented';