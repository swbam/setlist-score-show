-- Create function to get user vote statistics
CREATE OR REPLACE FUNCTION get_user_vote_stats(show_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    user_id_val UUID;
    daily_votes INTEGER := 0;
    show_votes INTEGER := 0;
    voted_songs TEXT[] := '{}';
    result JSON;
BEGIN
    -- Get current user ID from auth context
    user_id_val := auth.uid();
    
    -- If no user is authenticated, return default values
    IF user_id_val IS NULL THEN
        RETURN json_build_object(
            'daily_votes_used', 0,
            'daily_votes_remaining', 50,
            'show_votes_used', 0,
            'show_votes_remaining', 10,
            'user_voted_songs', '[]'::json
        );
    END IF;

    -- Get daily votes count (reset daily)
    SELECT COALESCE(daily_votes, 0) INTO daily_votes
    FROM vote_limits 
    WHERE user_id = user_id_val 
    AND show_id = show_id_param
    AND last_daily_reset = CURRENT_DATE;

    -- Get show-specific votes count
    SELECT COALESCE(show_votes, 0) INTO show_votes
    FROM vote_limits 
    WHERE user_id = user_id_val 
    AND show_id = show_id_param;

    -- Get list of songs user has voted for in this show
    SELECT ARRAY_AGG(DISTINCT s.song_id) INTO voted_songs
    FROM votes v
    JOIN setlist_songs ss ON v.setlist_song_id = ss.id
    JOIN setlists s ON ss.setlist_id = s.id
    WHERE v.user_id = user_id_val 
    AND s.show_id = show_id_param;

    -- Handle null case
    IF voted_songs IS NULL THEN
        voted_songs := '{}';
    END IF;

    -- Build result JSON
    result := json_build_object(
        'daily_votes_used', daily_votes,
        'daily_votes_remaining', GREATEST(0, 50 - daily_votes),
        'show_votes_used', show_votes,
        'show_votes_remaining', GREATEST(0, 10 - show_votes),
        'user_voted_songs', array_to_json(voted_songs)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_vote_stats(TEXT) TO authenticated;