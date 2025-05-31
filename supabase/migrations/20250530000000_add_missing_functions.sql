-- Add missing columns to existing tables
ALTER TABLE setlist_songs ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0;
ALTER TABLE setlists ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Create user_vote_stats table if not exists
CREATE TABLE IF NOT EXISTS user_vote_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    daily_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    last_vote_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS on user_vote_stats
ALTER TABLE user_vote_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own stats" ON user_vote_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON user_vote_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_vote_stats FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_vote_stats
CREATE TRIGGER update_user_vote_stats_updated_at BEFORE UPDATE ON user_vote_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix vote_for_song function with proper return type
CREATE OR REPLACE FUNCTION vote_for_song(
  setlist_song_id UUID
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_show_votes INTEGER;
  v_daily_votes INTEGER;
  v_show_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get show_id for this setlist_song
  SELECT s.show_id INTO v_show_id
  FROM setlist_songs ss
  JOIN setlists s ON ss.setlist_id = s.id
  WHERE ss.id = setlist_song_id;
  
  IF v_show_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid setlist song');
  END IF;
  
  -- Check if already voted
  IF EXISTS (SELECT 1 FROM votes WHERE user_id = v_user_id AND setlist_song_id = vote_for_song.setlist_song_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already voted for this song');
  END IF;
  
  -- Check show-specific vote limit (10 per show)
  SELECT COUNT(*) INTO v_show_votes
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists s ON ss.setlist_id = s.id
  WHERE v.user_id = v_user_id AND s.show_id = v_show_id;
  
  IF v_show_votes >= 10 THEN
    RETURN json_build_object('success', false, 'error', 'Show vote limit reached (10 votes per show)');
  END IF;
  
  -- Check daily vote limit (50 per day)
  SELECT COUNT(*) INTO v_daily_votes
  FROM votes 
  WHERE user_id = v_user_id 
  AND DATE(created_at) = CURRENT_DATE;
  
  IF v_daily_votes >= 50 THEN
    RETURN json_build_object('success', false, 'error', 'Daily vote limit reached (50 votes per day)');
  END IF;
  
  -- Insert vote and update counts atomically
  INSERT INTO votes (user_id, setlist_song_id, vote_type) VALUES (v_user_id, setlist_song_id, 'up');
  UPDATE setlist_songs SET votes = votes + 1 WHERE id = setlist_song_id;
  UPDATE setlists SET total_votes = total_votes + 1 
  WHERE id = (SELECT setlist_id FROM setlist_songs WHERE id = setlist_song_id);
  
  -- Update user stats
  INSERT INTO user_vote_stats (user_id, daily_votes, total_votes, last_vote_date)
  VALUES (v_user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_votes = CASE WHEN user_vote_stats.last_vote_date = CURRENT_DATE 
                  THEN user_vote_stats.daily_votes + 1 ELSE 1 END,
    total_votes = user_vote_stats.total_votes + 1,
    last_vote_date = CURRENT_DATE;
  
  RETURN json_build_object('success', true, 'message', 'Vote recorded successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create increment_show_views function
CREATE OR REPLACE FUNCTION increment_show_views(
  show_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE shows SET view_count = view_count + 1 WHERE id = show_id;
END;
$$ LANGUAGE plpgsql;

-- Create match_song_similarity function
CREATE OR REPLACE FUNCTION match_song_similarity(
  p_artist_id UUID,
  p_song_name TEXT,
  p_similarity_threshold DECIMAL DEFAULT 0.3
) RETURNS TABLE(
  id UUID,
  name TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title as name,
    similarity(s.title, p_song_name) as similarity
  FROM songs s
  WHERE s.artist_id = p_artist_id
  AND similarity(s.title, p_song_name) >= p_similarity_threshold
  ORDER BY similarity DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Create get_user_vote_stats function
CREATE OR REPLACE FUNCTION get_user_vote_stats(
  show_id_param UUID
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_show_votes INTEGER;
  v_daily_votes INTEGER;
  v_total_votes INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'show_votes', 0,
      'daily_votes', 0,
      'total_votes', 0,
      'show_limit', 10,
      'daily_limit', 50
    );
  END IF;
  
  -- Get show-specific votes
  SELECT COUNT(*) INTO v_show_votes
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists s ON ss.setlist_id = s.id
  WHERE v.user_id = v_user_id AND s.show_id = show_id_param;
  
  -- Get daily votes
  SELECT COUNT(*) INTO v_daily_votes
  FROM votes 
  WHERE user_id = v_user_id 
  AND DATE(created_at) = CURRENT_DATE;
  
  -- Get total votes
  SELECT COALESCE(total_votes, 0) INTO v_total_votes
  FROM user_vote_stats
  WHERE user_id = v_user_id;
  
  RETURN json_build_object(
    'show_votes', v_show_votes,
    'daily_votes', v_daily_votes,
    'total_votes', v_total_votes,
    'show_limit', 10,
    'daily_limit', 50
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trending shows materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_shows AS
SELECT 
  s.id AS show_id,
  s.artist_id,
  s.venue_id,
  s.title AS show_name,
  s.date AS show_date,
  s.view_count,
  COUNT(DISTINCT v.user_id) as unique_voters,
  COALESCE(SUM(ss.votes), 0) as total_votes,
  (
    s.view_count * 0.3 + 
    COALESCE(SUM(ss.votes), 0) * 0.4 +
    COUNT(DISTINCT v.user_id) * 0.3 *
    CASE 
      WHEN s.date <= NOW() + INTERVAL '7 days' THEN 2.0
      WHEN s.date <= NOW() + INTERVAL '30 days' THEN 1.5
      WHEN s.date <= NOW() + INTERVAL '90 days' THEN 1.0
      ELSE 0.5
    END
  ) as trending_score
FROM shows s
LEFT JOIN setlists sl ON sl.show_id = s.id
LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
LEFT JOIN votes v ON v.setlist_song_id = ss.id
WHERE s.date >= CURRENT_DATE
GROUP BY s.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS trending_shows_show_id_idx ON trending_shows (show_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced trending functions
CREATE OR REPLACE FUNCTION get_trending_shows_enhanced(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  title TEXT,
  date DATE,
  view_count INTEGER,
  total_votes INTEGER,
  trending_score DECIMAL,
  artist_name TEXT,
  venue_name TEXT,
  city TEXT,
  state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.date,
    s.view_count,
    COALESCE(ts.total_votes::INTEGER, 0) as total_votes,
    COALESCE(ts.trending_score, 0) as trending_score,
    a.name as artist_name,
    v.name as venue_name,
    v.city,
    v.state
  FROM shows s
  LEFT JOIN trending_shows ts ON s.id = ts.show_id
  LEFT JOIN artists a ON s.artist_id = a.id
  LEFT JOIN venues v ON s.venue_id = v.id
  WHERE s.date >= CURRENT_DATE
  ORDER BY COALESCE(ts.trending_score, s.view_count) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_trending_artists_enhanced(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  name TEXT,
  image_url TEXT,
  total_shows INTEGER,
  total_votes INTEGER,
  popularity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.image_url,
    COUNT(DISTINCT s.id)::INTEGER as total_shows,
    COALESCE(SUM(ts.total_votes)::INTEGER, 0) as total_votes,
    a.popularity
  FROM artists a
  LEFT JOIN shows s ON a.id = s.artist_id AND s.date >= CURRENT_DATE
  LEFT JOIN trending_shows ts ON s.id = ts.show_id
  GROUP BY a.id, a.name, a.image_url, a.popularity
  ORDER BY COALESCE(SUM(ts.total_votes), a.popularity) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_trending_songs_enhanced(
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE(
  id UUID,
  title TEXT,
  artist_name TEXT,
  total_votes INTEGER,
  vote_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    a.name as artist_name,
    COALESCE(ss.votes, 0) as total_votes,
    CASE 
      WHEN sl.total_votes > 0 THEN (COALESCE(ss.votes, 0)::DECIMAL / sl.total_votes * 100)
      ELSE 0
    END as vote_percentage
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  LEFT JOIN setlist_songs ss ON s.id = ss.song_id
  LEFT JOIN setlists sl ON ss.setlist_id = sl.id
  LEFT JOIN shows sh ON sl.show_id = sh.id
  WHERE sh.date >= CURRENT_DATE
  ORDER BY COALESCE(ss.votes, 0) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_trending_scores()
RETURNS VOID AS $$
BEGIN
  -- Update trending scores for all shows
  UPDATE shows SET trending_score = (
    view_count * 0.3 + 
    COALESCE((
      SELECT SUM(ss.votes)
      FROM setlists sl
      JOIN setlist_songs ss ON sl.id = ss.setlist_id
      WHERE sl.show_id = shows.id
    ), 0) * 0.4 +
    COALESCE((
      SELECT COUNT(DISTINCT v.user_id)
      FROM setlists sl
      JOIN setlist_songs ss ON sl.id = ss.setlist_id
      JOIN votes v ON ss.id = v.setlist_song_id
      WHERE sl.show_id = shows.id
    ), 0) * 0.3 *
    CASE 
      WHEN date <= NOW() + INTERVAL '7 days' THEN 2.0
      WHEN date <= NOW() + INTERVAL '30 days' THEN 1.5
      WHEN date <= NOW() + INTERVAL '90 days' THEN 1.0
      ELSE 0.5
    END
  )
  WHERE date >= CURRENT_DATE;
  
  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_voting_stats(
  user_id_param UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_stats JSON;
BEGIN
  v_user_id := COALESCE(user_id_param, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'total_votes', 0,
      'daily_votes', 0,
      'shows_voted', 0,
      'favorite_artists', '[]'::json
    );
  END IF;
  
  SELECT json_build_object(
    'total_votes', COALESCE(uvs.total_votes, 0),
    'daily_votes', COALESCE(uvs.daily_votes, 0),
    'shows_voted', (
      SELECT COUNT(DISTINCT sl.show_id)
      FROM votes v
      JOIN setlist_songs ss ON v.setlist_song_id = ss.id
      JOIN setlists sl ON ss.setlist_id = sl.id
      WHERE v.user_id = v_user_id
    ),
    'favorite_artists', COALESCE((
      SELECT json_agg(json_build_object('name', a.name, 'votes', vote_count))
      FROM (
        SELECT a.name, COUNT(*) as vote_count
        FROM votes v
        JOIN setlist_songs ss ON v.setlist_song_id = ss.id
        JOIN songs s ON ss.song_id = s.id
        JOIN artists a ON s.artist_id = a.id
        WHERE v.user_id = v_user_id
        GROUP BY a.id, a.name
        ORDER BY vote_count DESC
        LIMIT 5
      ) top_artists
    ), '[]'::json)
  ) INTO v_stats
  FROM user_vote_stats uvs
  WHERE uvs.user_id = v_user_id;
  
  RETURN COALESCE(v_stats, json_build_object(
    'total_votes', 0,
    'daily_votes', 0,
    'shows_voted', 0,
    'favorite_artists', '[]'::json
  ));
END;
$$ LANGUAGE plpgsql;

-- Create performance indexes with a more permissive date filter
CREATE INDEX IF NOT EXISTS idx_shows_trending_score_date ON shows(trending_score DESC, date) WHERE date >= '2024-01-01';
CREATE INDEX IF NOT EXISTS idx_votes_user_date ON votes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes_desc ON setlist_songs(votes DESC);
CREATE INDEX IF NOT EXISTS idx_user_vote_stats_user_id ON user_vote_stats(user_id);