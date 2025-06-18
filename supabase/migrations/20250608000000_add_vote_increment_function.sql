-- Create function to increment vote count atomically
CREATE OR REPLACE FUNCTION increment_vote_count(setlist_song_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE setlist_songs
  SET vote_count = vote_count + 1
  WHERE id = setlist_song_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_vote_count(UUID) TO authenticated;