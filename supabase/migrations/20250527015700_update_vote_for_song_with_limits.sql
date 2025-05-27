CREATE OR REPLACE FUNCTION vote_for_song(
  p_user_id UUID,
  p_setlist_song_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Check if user already voted
  IF EXISTS (
    SELECT 1 FROM votes 
    WHERE user_id = p_user_id 
    AND setlist_song_id = p_setlist_song_id
  ) THEN
    RAISE EXCEPTION 'Already voted for this song';
  END IF;
  
  -- Check daily vote limit (50 votes)
  IF (
    SELECT COUNT(*) FROM votes 
    WHERE user_id = p_user_id 
    AND DATE(created_at) = CURRENT_DATE
  ) >= 50 THEN
    RAISE EXCEPTION 'Daily vote limit reached';
  END IF;
  
  -- Insert vote and increment count
  INSERT INTO votes (user_id, setlist_song_id) 
  VALUES (p_user_id, p_setlist_song_id);
  
  UPDATE setlist_songs 
  SET votes = votes + 1 
  WHERE id = p_setlist_song_id;
END;
$$ LANGUAGE plpgsql;