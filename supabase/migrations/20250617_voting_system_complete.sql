-- Complete Voting System Migration
-- Creates all necessary functions and triggers for real-time voting

-- Create the vote_for_song RPC function
CREATE OR REPLACE FUNCTION vote_for_song(
  setlist_song_id_param UUID,
  user_id_param UUID
) RETURNS JSON AS $$
DECLARE
  result JSON;
  existing_vote_count INTEGER;
  new_vote_count INTEGER;
BEGIN
  -- Check if user has already voted for this setlist song
  SELECT COUNT(*) INTO existing_vote_count
  FROM votes 
  WHERE user_id = user_id_param 
    AND setlist_song_id = setlist_song_id_param;
  
  IF existing_vote_count > 0 THEN
    RAISE EXCEPTION 'User has already voted for this song';
  END IF;
  
  -- Insert the vote
  INSERT INTO votes (user_id, setlist_song_id, created_at)
  VALUES (user_id_param, setlist_song_id_param, NOW());
  
  -- Update the vote count on setlist_songs
  UPDATE setlist_songs 
  SET 
    vote_count = vote_count + 1,
    updated_at = NOW()
  WHERE id = setlist_song_id_param
  RETURNING vote_count INTO new_vote_count;
  
  result := json_build_object(
    'success', true,
    'new_vote_count', new_vote_count,
    'setlist_song_id', setlist_song_id_param
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically create initial setlist when a show is created
CREATE OR REPLACE FUNCTION create_initial_setlist_for_show_v2(
  show_id_param UUID,
  artist_id_param UUID
) RETURNS JSON AS $$
DECLARE
  setlist_id UUID;
  songs_data JSON;
  song_record RECORD;
  position_counter INTEGER := 1;
  songs_added INTEGER := 0;
  target_songs INTEGER := 5;
BEGIN
  -- Check if setlist already exists for this show
  SELECT id INTO setlist_id FROM setlists WHERE show_id = show_id_param LIMIT 1;
  
  IF setlist_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Setlist already exists',
      'setlist_id', setlist_id
    );
  END IF;
  
  -- Create the setlist
  INSERT INTO setlists (show_id, created_at, updated_at)
  VALUES (show_id_param, NOW(), NOW())
  RETURNING id INTO setlist_id;
  
  -- Get a mix of popular and diverse songs from the artist
  FOR song_record IN (
    WITH popular_songs AS (
      SELECT id, title, popularity
      FROM songs 
      WHERE artist_id = artist_id_param 
        AND popularity > 50
      ORDER BY popularity DESC 
      LIMIT 3
    ),
    diverse_songs AS (
      SELECT id, title, popularity
      FROM songs 
      WHERE artist_id = artist_id_param 
        AND id NOT IN (SELECT id FROM popular_songs)
      ORDER BY RANDOM()
      LIMIT 2
    )
    SELECT id, title FROM popular_songs
    UNION ALL
    SELECT id, title FROM diverse_songs
    ORDER BY RANDOM()
  ) LOOP
    -- Insert song into setlist
    INSERT INTO setlist_songs (
      setlist_id, 
      song_id, 
      position, 
      vote_count, 
      created_at, 
      updated_at
    )
    VALUES (
      setlist_id, 
      song_record.id, 
      position_counter, 
      0, 
      NOW(), 
      NOW()
    );
    
    position_counter := position_counter + 1;
    songs_added := songs_added + 1;
    
    EXIT WHEN songs_added >= target_songs;
  END LOOP;
  
  -- If we don't have enough songs, fill with any available songs
  IF songs_added < target_songs THEN
    FOR song_record IN (
      SELECT id, title 
      FROM songs 
      WHERE artist_id = artist_id_param 
        AND id NOT IN (
          SELECT song_id FROM setlist_songs WHERE setlist_id = setlist_id
        )
      ORDER BY RANDOM()
      LIMIT (target_songs - songs_added)
    ) LOOP
      INSERT INTO setlist_songs (
        setlist_id, 
        song_id, 
        position, 
        vote_count, 
        created_at, 
        updated_at
      )
      VALUES (
        setlist_id, 
        song_record.id, 
        position_counter, 
        0, 
        NOW(), 
        NOW()
      );
      
      position_counter := position_counter + 1;
      songs_added := songs_added + 1;
    END LOOP;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'setlist_id', setlist_id,
    'songs_added', songs_added,
    'message', 'Initial setlist created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get complete setlist with voting data
CREATE OR REPLACE FUNCTION get_setlist_with_votes(
  setlist_id_param UUID,
  user_id_param UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH setlist_data AS (
    SELECT 
      ss.id,
      ss.song_id,
      ss.position,
      ss.vote_count,
      s.title as song_title,
      s.album as song_album,
      s.popularity as song_popularity,
      CASE 
        WHEN user_id_param IS NOT NULL THEN 
          EXISTS(
            SELECT 1 FROM votes v 
            WHERE v.setlist_song_id = ss.id 
              AND v.user_id = user_id_param
          )
        ELSE false
      END as has_voted
    FROM setlist_songs ss
    JOIN songs s ON ss.song_id = s.id
    WHERE ss.setlist_id = setlist_id_param
    ORDER BY ss.vote_count DESC, ss.position ASC
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'song_id', song_id,
      'position', position,
      'vote_count', vote_count,
      'has_voted', has_voted,
      'song', json_build_object(
        'id', song_id,
        'title', song_title,
        'album', song_album,
        'popularity', song_popularity
      )
    )
  ) INTO result
  FROM setlist_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add song to existing setlist
CREATE OR REPLACE FUNCTION add_song_to_setlist(
  setlist_id_param UUID,
  song_id_param UUID,
  user_id_param UUID
) RETURNS JSON AS $$
DECLARE
  new_position INTEGER;
  setlist_song_id UUID;
BEGIN
  -- Check if song is already in setlist
  IF EXISTS(
    SELECT 1 FROM setlist_songs 
    WHERE setlist_id = setlist_id_param AND song_id = song_id_param
  ) THEN
    RAISE EXCEPTION 'Song is already in this setlist';
  END IF;
  
  -- Get next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO new_position
  FROM setlist_songs 
  WHERE setlist_id = setlist_id_param;
  
  -- Insert the song
  INSERT INTO setlist_songs (
    setlist_id, 
    song_id, 
    position, 
    vote_count, 
    created_at, 
    updated_at
  )
  VALUES (
    setlist_id_param, 
    song_id_param, 
    new_position, 
    0, 
    NOW(), 
    NOW()
  )
  RETURNING id INTO setlist_song_id;
  
  RETURN json_build_object(
    'success', true,
    'setlist_song_id', setlist_song_id,
    'position', new_position
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get voting stats for a show
CREATE OR REPLACE FUNCTION get_voting_stats(show_id_param UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  WITH show_stats AS (
    SELECT 
      s.id as setlist_id,
      COUNT(DISTINCT v.user_id) as unique_voters,
      COUNT(v.id) as total_votes,
      COUNT(DISTINCT ss.id) as total_songs
    FROM setlists s
    LEFT JOIN setlist_songs ss ON s.id = ss.setlist_id
    LEFT JOIN votes v ON ss.id = v.setlist_song_id
    WHERE s.show_id = show_id_param
    GROUP BY s.id
  )
  SELECT json_build_object(
    'setlist_id', setlist_id,
    'unique_voters', COALESCE(unique_voters, 0),
    'total_votes', COALESCE(total_votes, 0),
    'total_songs', COALESCE(total_songs, 0)
  ) INTO stats
  FROM show_stats
  LIMIT 1;
  
  RETURN COALESCE(stats, json_build_object(
    'setlist_id', null,
    'unique_voters', 0,
    'total_votes', 0,
    'total_songs', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create setlist when show is inserted
CREATE OR REPLACE FUNCTION trigger_create_setlist_for_new_show()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create setlist for upcoming shows
  IF NEW.status = 'upcoming' AND NEW.date > NOW() THEN
    PERFORM create_initial_setlist_for_show_v2(NEW.id, NEW.artist_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_setlist_trigger ON shows;

-- Create the trigger
CREATE TRIGGER auto_create_setlist_trigger
  AFTER INSERT ON shows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_setlist_for_new_show();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_user_setlist_song ON votes(user_id, setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_votes_setlist_song ON votes(setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_vote_count ON setlist_songs(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlists_show_id ON setlists(show_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION vote_for_song TO authenticated;
GRANT EXECUTE ON FUNCTION create_initial_setlist_for_show_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION get_setlist_with_votes TO authenticated;
GRANT EXECUTE ON FUNCTION add_song_to_setlist TO authenticated;
GRANT EXECUTE ON FUNCTION get_voting_stats TO authenticated;