-- Enable anonymous voting and add necessary RPC functions

-- Function to increment show views
CREATE OR REPLACE FUNCTION increment_show_views(show_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shows 
  SET view_count = view_count + 1 
  WHERE id = show_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for anonymous voting with limits
CREATE OR REPLACE FUNCTION vote_for_song_anonymous(
  p_setlist_song_id UUID,
  p_user_id TEXT,
  p_show_id UUID
)
RETURNS VOID AS $$
DECLARE
  daily_vote_count INTEGER;
  show_vote_count INTEGER;
  existing_vote UUID;
BEGIN
  -- Check if user already voted for this specific song
  SELECT id INTO existing_vote
  FROM votes 
  WHERE setlist_song_id = p_setlist_song_id 
    AND user_id = p_user_id;
  
  IF existing_vote IS NOT NULL THEN
    RAISE EXCEPTION 'User has already voted for this song';
  END IF;
  
  -- Check daily vote limit (50 per day)
  SELECT COUNT(*) INTO daily_vote_count
  FROM votes 
  WHERE user_id = p_user_id 
    AND created_at >= CURRENT_DATE;
  
  IF daily_vote_count >= 50 THEN
    RAISE EXCEPTION 'Daily vote limit exceeded (50 votes per day)';
  END IF;
  
  -- Check show vote limit (10 per show)
  SELECT COUNT(*) INTO show_vote_count
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists s ON ss.setlist_id = s.id
  WHERE v.user_id = p_user_id 
    AND s.show_id = p_show_id;
  
  IF show_vote_count >= 10 THEN
    RAISE EXCEPTION 'Show vote limit exceeded (10 votes per show)';
  END IF;
  
  -- Insert the vote
  INSERT INTO votes (setlist_song_id, user_id, created_at)
  VALUES (p_setlist_song_id, p_user_id, NOW());
  
  -- Update the vote count on the setlist_song
  UPDATE setlist_songs 
  SET votes = votes + 1 
  WHERE id = p_setlist_song_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vote statistics for a user
CREATE OR REPLACE FUNCTION get_user_vote_stats(
  p_user_id TEXT,
  p_show_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  daily_votes INTEGER;
  show_votes INTEGER;
  result JSON;
BEGIN
  -- Get daily vote count
  SELECT COUNT(*) INTO daily_votes
  FROM votes 
  WHERE user_id = p_user_id 
    AND created_at >= CURRENT_DATE;
  
  -- Get show vote count if show_id provided
  IF p_show_id IS NOT NULL THEN
    SELECT COUNT(*) INTO show_votes
    FROM votes v
    JOIN setlist_songs ss ON v.setlist_song_id = ss.id
    JOIN setlists s ON ss.setlist_id = s.id
    WHERE v.user_id = p_user_id 
      AND s.show_id = p_show_id;
  ELSE
    show_votes := 0;
  END IF;
  
  result := json_build_object(
    'daily_votes_used', daily_votes,
    'daily_votes_remaining', 50 - daily_votes,
    'show_votes_used', show_votes,
    'show_votes_remaining', 10 - show_votes
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to allow anonymous access for voting
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert votes (anonymous voting)
CREATE POLICY "Anyone can vote" ON votes
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read votes
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT 
  USING (true);

-- Allow reading setlist_songs for vote counts
CREATE POLICY "Anyone can read setlist_songs" ON setlist_songs
  FOR SELECT 
  USING (true);

-- Allow updating vote counts on setlist_songs
CREATE POLICY "System can update vote counts" ON setlist_songs
  FOR UPDATE 
  USING (true);

-- Allow reading shows data
CREATE POLICY "Anyone can read shows" ON shows
  FOR SELECT 
  USING (true);

-- Allow updating show view counts
CREATE POLICY "System can update view counts" ON shows
  FOR UPDATE 
  USING (true);

-- Allow reading and creating setlists
CREATE POLICY "Anyone can read setlists" ON setlists
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create setlists" ON setlists
  FOR INSERT 
  WITH CHECK (true);

-- Allow reading and creating songs
CREATE POLICY "Anyone can read songs" ON songs
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create songs" ON songs
  FOR INSERT 
  WITH CHECK (true);

-- Allow creating setlist_songs
CREATE POLICY "Anyone can create setlist_songs" ON setlist_songs
  FOR INSERT 
  WITH CHECK (true);
