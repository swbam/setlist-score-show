-- Migration: Add get_user_voting_stats function
-- Description: Comprehensive user voting statistics function

CREATE OR REPLACE FUNCTION get_user_voting_stats(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_votes INTEGER;
    daily_votes INTEGER;
    weekly_votes INTEGER;
    monthly_votes INTEGER;
    voting_streak INTEGER;
    accuracy_score NUMERIC;
    favorite_artists JSON;
BEGIN
    -- Calculate total votes
    SELECT COUNT(*)
    INTO total_votes
    FROM votes
    WHERE user_id = user_id_param;

    -- Calculate daily votes (today)
    SELECT COUNT(*)
    INTO daily_votes
    FROM votes
    WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE;

    -- Calculate weekly votes (last 7 days)
    SELECT COUNT(*)
    INTO weekly_votes
    FROM votes
    WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '7 days';

    -- Calculate monthly votes (last 30 days)
    SELECT COUNT(*)
    INTO monthly_votes
    FROM votes
    WHERE user_id = user_id_param
    AND created_at >= CURRENT_DATE - INTERVAL '30 days';

    -- Calculate voting streak (consecutive days with votes)
    WITH daily_vote_counts AS (
        SELECT DATE(created_at) as vote_date
        FROM votes
        WHERE user_id = user_id_param
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
    ),
    streak_calculation AS (
        SELECT vote_date,
               ROW_NUMBER() OVER (ORDER BY vote_date DESC) as rn,
               vote_date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY vote_date DESC) - 1) as expected_date
        FROM daily_vote_counts
    )
    SELECT COUNT(*)
    INTO voting_streak
    FROM streak_calculation
    WHERE vote_date = expected_date
    AND vote_date <= CURRENT_DATE;

    -- Calculate accuracy score (percentage of voted songs that were actually played)
    -- This is a simplified calculation - could be enhanced with actual setlist comparison
    SELECT COALESCE(
        ROUND(
            (COUNT(CASE WHEN ss.position <= 20 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
            1
        ), 0
    )
    INTO accuracy_score
    FROM votes v
    JOIN setlist_songs ss ON v.setlist_song_id = ss.id
    WHERE v.user_id = user_id_param;

    -- Get favorite artists (most voted for)
    SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', a.id,
            'name', a.name,
            'image_url', a.image_url,
            'vote_count', artist_votes.vote_count
        )
    )
    INTO favorite_artists
    FROM (
        SELECT 
            s.artist_id,
            COUNT(*) as vote_count
        FROM votes v
        JOIN setlist_songs ss ON v.setlist_song_id = ss.id
        JOIN setlists sl ON ss.setlist_id = sl.id
        JOIN shows sh ON sl.show_id = sh.id
        JOIN songs s ON ss.song_id = s.id
        WHERE v.user_id = user_id_param
        GROUP BY s.artist_id
        ORDER BY vote_count DESC
        LIMIT 5
    ) artist_votes
    JOIN artists a ON artist_votes.artist_id = a.id;

    -- Build result JSON
    result := JSON_BUILD_OBJECT(
        'totalVotes', COALESCE(total_votes, 0),
        'dailyVotes', COALESCE(daily_votes, 0),
        'weeklyVotes', COALESCE(weekly_votes, 0),
        'monthlyVotes', COALESCE(monthly_votes, 0),
        'votingStreak', COALESCE(voting_streak, 0),
        'accuracyScore', COALESCE(accuracy_score, 0),
        'favoriteArtists', COALESCE(favorite_artists, '[]'::JSON)
    );

    RETURN result;
END;
$$;
