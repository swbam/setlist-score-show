-- Enhanced RPC functions for TheSet platform

-- Function to get trending artists with show counts
CREATE OR REPLACE FUNCTION get_trending_artists(p_limit INTEGER DEFAULT 24)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  image_url TEXT,
  genres TEXT[],
  popularity INTEGER,
  followers INTEGER,
  upcoming_shows_count BIGINT,
  next_show_date DATE,
  tour_cities TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.slug,
    a.image_url,
    a.genres,
    a.popularity,
    a.followers,
    COUNT(DISTINCT s.id) as upcoming_shows_count,
    MIN(s.date)::date as next_show_date,
    array_agg(DISTINCT v.city || ', ' || v.state) FILTER (WHERE v.city IS NOT NULL) as tour_cities
  FROM artists a
  JOIN shows s ON s.artist_id = a.id
  JOIN venues v ON v.id = s.venue_id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND s.date <= CURRENT_DATE + INTERVAL '90 days'
    AND a.image_url IS NOT NULL
  GROUP BY a.id
  ORDER BY a.popularity DESC, upcoming_shows_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get top shows with engagement data
CREATE OR REPLACE FUNCTION get_top_shows(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  date DATE,
  ticketmaster_url TEXT,
  tickets_url TEXT,
  min_price DECIMAL,
  max_price DECIMAL,
  popularity INTEGER,
  artist JSONB,
  venue JSONB,
  total_votes BIGINT,
  songs_voted BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.date::date,
    s.ticketmaster_url,
    s.tickets_url,
    s.min_price,
    s.max_price,
    s.popularity,
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'slug', a.slug,
      'image_url', a.image_url
    ) as artist,
    jsonb_build_object(
      'id', v.id,
      'name', v.name,
      'city', v.city,
      'state', v.state,
      'capacity', v.capacity
    ) as venue,
    COALESCE(SUM(ss.vote_count), 0) as total_votes,
    COUNT(DISTINCT ss.song_id) as songs_voted
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN setlists sl ON sl.show_id = s.id
  LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND s.date <= CURRENT_DATE + INTERVAL '30 days'
    AND v.capacity > 1000
  GROUP BY s.id, a.id, v.id
  ORDER BY total_votes DESC, v.capacity DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to track search queries
CREATE OR REPLACE FUNCTION track_search_query(
  p_query TEXT,
  p_result_count INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL,
  p_search_type TEXT DEFAULT 'general'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO search_analytics (query, result_count, user_id, search_type)
  VALUES (p_query, p_result_count, p_user_id, p_search_type)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's followed artists with show data
CREATE OR REPLACE FUNCTION get_user_followed_artists(p_user_id UUID)
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  artist_slug TEXT,
  artist_image TEXT,
  followed_at TIMESTAMPTZ,
  upcoming_shows_count BIGINT,
  next_show_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as artist_id,
    a.name as artist_name,
    a.slug as artist_slug,
    a.image_url as artist_image,
    ua.created_at as followed_at,
    COUNT(DISTINCT s.id) as upcoming_shows_count,
    MIN(s.date)::date as next_show_date
  FROM user_artists ua
  JOIN artists a ON a.id = ua.artist_id
  LEFT JOIN shows s ON s.artist_id = a.id AND s.status = 'upcoming' AND s.date >= CURRENT_DATE
  WHERE ua.user_id = p_user_id
  GROUP BY a.id, ua.created_at
  ORDER BY ua.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get venue details with location
CREATE OR REPLACE FUNCTION get_venue_details(p_venue_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  capacity INTEGER,
  latitude DECIMAL,
  longitude DECIMAL,
  upcoming_shows_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.address,
    v.city,
    v.state,
    v.country,
    v.postal_code,
    v.capacity,
    v.latitude,
    v.longitude,
    COUNT(DISTINCT s.id) as upcoming_shows_count
  FROM venues v
  LEFT JOIN shows s ON s.venue_id = v.id AND s.status = 'upcoming' AND s.date >= CURRENT_DATE
  WHERE v.id = p_venue_id
  GROUP BY v.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update venue location using PostGIS
CREATE OR REPLACE FUNCTION update_venue_location(
  p_venue_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE venues
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  WHERE id = p_venue_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get show details with setlist and votes
CREATE OR REPLACE FUNCTION get_show_details(p_show_id UUID)
RETURNS TABLE (
  show_id UUID,
  show_title TEXT,
  show_date DATE,
  show_status TEXT,
  artist JSONB,
  venue JSONB,
  setlist JSONB,
  total_votes BIGINT,
  user_can_vote BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as show_id,
    s.title as show_title,
    s.date::date as show_date,
    s.status as show_status,
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'slug', a.slug,
      'image_url', a.image_url,
      'genres', a.genres
    ) as artist,
    jsonb_build_object(
      'id', v.id,
      'name', v.name,
      'city', v.city,
      'state', v.state,
      'capacity', v.capacity,
      'address', v.address
    ) as venue,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', sl.id,
          'name', sl.name,
          'is_encore', sl.is_encore,
          'songs', songs_data.songs
        )
        ORDER BY sl.order_index
      )
      FROM setlists sl
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', song.id,
            'title', song.title,
            'album', song.album,
            'position', ss.position,
            'vote_count', ss.vote_count
          )
          ORDER BY ss.position
        ) as songs
        FROM setlist_songs ss
        JOIN songs song ON song.id = ss.song_id
        WHERE ss.setlist_id = sl.id
      ) songs_data ON true
      WHERE sl.show_id = s.id
    ) as setlist,
    COALESCE(SUM(ss.vote_count), 0) as total_votes,
    (s.date > CURRENT_DATE) as user_can_vote
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN setlists sl ON sl.show_id = s.id
  LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
  WHERE s.id = p_show_id
  GROUP BY s.id, a.id, v.id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can vote on a show
CREATE OR REPLACE FUNCTION can_user_vote_on_show(
  p_user_id UUID,
  p_show_id UUID
)
RETURNS TABLE (
  can_vote BOOLEAN,
  reason TEXT,
  votes_used INTEGER,
  votes_remaining INTEGER
) AS $$
DECLARE
  v_show_date DATE;
  v_user_votes INTEGER;
  v_daily_votes INTEGER;
  v_max_votes_per_show INTEGER := 10;
  v_max_votes_per_day INTEGER := 50;
BEGIN
  -- Check if show exists and is upcoming
  SELECT date INTO v_show_date
  FROM shows
  WHERE id = p_show_id AND status = 'upcoming';
  
  IF v_show_date IS NULL THEN
    RETURN QUERY SELECT false, 'Show not found or not upcoming', 0, 0;
    RETURN;
  END IF;
  
  IF v_show_date <= CURRENT_DATE THEN
    RETURN QUERY SELECT false, 'Voting closed - show has started', 0, 0;
    RETURN;
  END IF;
  
  -- Check user's votes for this show
  SELECT COUNT(*) INTO v_user_votes
  FROM votes
  WHERE user_id = p_user_id AND show_id = p_show_id;
  
  -- Check user's daily votes
  SELECT COUNT(*) INTO v_daily_votes
  FROM votes
  WHERE user_id = p_user_id 
    AND created_at >= CURRENT_DATE
    AND created_at < CURRENT_DATE + INTERVAL '1 day';
  
  -- Return vote eligibility
  IF v_user_votes >= v_max_votes_per_show THEN
    RETURN QUERY SELECT false, 'Maximum votes per show reached', v_user_votes, 0;
  ELSIF v_daily_votes >= v_max_votes_per_day THEN
    RETURN QUERY SELECT false, 'Daily vote limit reached', v_user_votes, 0;
  ELSE
    RETURN QUERY SELECT 
      true, 
      'Can vote', 
      v_user_votes, 
      LEAST(v_max_votes_per_show - v_user_votes, v_max_votes_per_day - v_daily_votes);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment vote count with validation
CREATE OR REPLACE FUNCTION increment_vote_count(
  p_user_id UUID,
  p_setlist_song_id UUID,
  p_show_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_vote_count INTEGER
) AS $$
DECLARE
  v_can_vote BOOLEAN;
  v_reason TEXT;
  v_current_vote_count INTEGER;
  v_new_vote_count INTEGER;
  v_existing_vote_id UUID;
BEGIN
  -- Check if user can vote
  SELECT cv.can_vote, cv.reason INTO v_can_vote, v_reason
  FROM can_user_vote_on_show(p_user_id, p_show_id) cv;
  
  IF NOT v_can_vote THEN
    RETURN QUERY SELECT false, v_reason, 0;
    RETURN;
  END IF;
  
  -- Check if user already voted for this song
  SELECT id INTO v_existing_vote_id
  FROM votes
  WHERE user_id = p_user_id AND setlist_song_id = p_setlist_song_id;
  
  IF v_existing_vote_id IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Already voted for this song', 0;
    RETURN;
  END IF;
  
  -- Get current vote count
  SELECT vote_count INTO v_current_vote_count
  FROM setlist_songs
  WHERE id = p_setlist_song_id;
  
  -- Insert vote and update count atomically
  BEGIN
    INSERT INTO votes (user_id, setlist_song_id, show_id, vote_type)
    VALUES (p_user_id, p_setlist_song_id, p_show_id, 'up');
    
    UPDATE setlist_songs
    SET vote_count = vote_count + 1,
        updated_at = NOW()
    WHERE id = p_setlist_song_id
    RETURNING vote_count INTO v_new_vote_count;
    
    -- Update user vote analytics
    INSERT INTO vote_analytics (user_id, show_id, daily_votes, show_votes, last_vote_at)
    VALUES (p_user_id, p_show_id, 1, 1, NOW())
    ON CONFLICT (user_id, show_id)
    DO UPDATE SET
      daily_votes = vote_analytics.daily_votes + 1,
      show_votes = vote_analytics.show_votes + 1,
      last_vote_at = NOW();
    
    RETURN QUERY SELECT true, 'Vote recorded successfully', v_new_vote_count;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Failed to record vote', v_current_vote_count;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to all functions
GRANT EXECUTE ON FUNCTION get_trending_artists(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_shows(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_search_query(TEXT, INTEGER, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_followed_artists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_venue_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_venue_location(UUID, DECIMAL, DECIMAL) TO service_role;
GRANT EXECUTE ON FUNCTION get_show_details(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_user_vote_on_show(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_vote_count(UUID, UUID, UUID) TO authenticated;