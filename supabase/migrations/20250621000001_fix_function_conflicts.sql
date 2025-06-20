-- Fix function conflicts by dropping and recreating functions

-- Drop existing functions that may have different signatures
DROP FUNCTION IF EXISTS create_initial_setlist(UUID);
DROP FUNCTION IF EXISTS create_initial_setlist(UUID, UUID);
DROP FUNCTION IF EXISTS ensure_artist_has_songs(UUID);
DROP FUNCTION IF EXISTS populate_sample_data();

-- Function to create initial setlist when a show is added
CREATE OR REPLACE FUNCTION create_initial_setlist(
  p_show_id UUID,
  p_artist_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_setlist_id UUID;
  v_song_count INTEGER;
  v_songs UUID[];
  v_song_id UUID;
  v_position INTEGER := 1;
BEGIN
  -- Check if setlist already exists for this show
  SELECT id INTO v_setlist_id
  FROM setlists
  WHERE show_id = p_show_id;
  
  IF v_setlist_id IS NOT NULL THEN
    RETURN v_setlist_id;
  END IF;
  
  -- Create the main setlist
  INSERT INTO setlists (show_id, name, order_index, is_encore)
  VALUES (p_show_id, 'Main Set', 0, false)
  RETURNING id INTO v_setlist_id;
  
  -- Get songs for this artist (up to 5 songs)
  SELECT COUNT(*) INTO v_song_count
  FROM songs
  WHERE artist_id = p_artist_id;
  
  IF v_song_count > 0 THEN
    -- Get a mix of popular and random songs
    SELECT array_agg(id) INTO v_songs
    FROM (
      -- Get top 3 popular songs
      (SELECT id FROM songs 
       WHERE artist_id = p_artist_id 
       ORDER BY popularity DESC NULLS LAST
       LIMIT 3)
      UNION ALL
      -- Get 2 random songs
      (SELECT id FROM songs 
       WHERE artist_id = p_artist_id 
       ORDER BY RANDOM()
       LIMIT 2)
    ) mixed_songs
    LIMIT 5;
  ELSE
    -- If no songs exist for artist, create some placeholder songs
    FOR i IN 1..5 LOOP
      INSERT INTO songs (artist_id, title, album)
      VALUES (
        p_artist_id, 
        'Song ' || i, 
        'Unknown Album'
      )
      RETURNING id INTO v_song_id;
      
      v_songs := array_append(v_songs, v_song_id);
    END LOOP;
  END IF;
  
  -- Add songs to setlist
  FOREACH v_song_id IN ARRAY v_songs
  LOOP
    INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
    VALUES (v_setlist_id, v_song_id, v_position, 0);
    
    v_position := v_position + 1;
  END LOOP;
  
  RETURN v_setlist_id;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure artist has some songs for setlist creation
CREATE OR REPLACE FUNCTION ensure_artist_has_songs(p_artist_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_song_count INTEGER;
  v_artist_name TEXT;
BEGIN
  -- Check existing song count
  SELECT COUNT(*) INTO v_song_count
  FROM songs
  WHERE artist_id = p_artist_id;
  
  -- If artist has songs, return count
  IF v_song_count > 0 THEN
    RETURN v_song_count;
  END IF;
  
  -- Get artist name for song titles
  SELECT name INTO v_artist_name
  FROM artists
  WHERE id = p_artist_id;
  
  -- Create 5 placeholder songs
  FOR i IN 1..5 LOOP
    INSERT INTO songs (artist_id, title, album, popularity)
    VALUES (
      p_artist_id,
      CASE i
        WHEN 1 THEN v_artist_name || ' - Hit Song'
        WHEN 2 THEN v_artist_name || ' - Popular Track'
        WHEN 3 THEN v_artist_name || ' - Fan Favorite'
        WHEN 4 THEN v_artist_name || ' - Classic'
        WHEN 5 THEN v_artist_name || ' - New Single'
      END,
      'Greatest Hits',
      100 - (i * 10) -- Decreasing popularity
    );
  END LOOP;
  
  RETURN 5;
END;
$$ LANGUAGE plpgsql;

-- Function to populate sample data for testing
CREATE OR REPLACE FUNCTION populate_sample_data()
RETURNS TEXT AS $$
DECLARE
  v_artist_id UUID;
  v_venue_id UUID;
  v_show_id UUID;
  v_result_text TEXT := '';
BEGIN
  -- Create sample artists if none exist
  IF (SELECT COUNT(*) FROM artists) = 0 THEN
    -- Insert Taylor Swift
    INSERT INTO artists (name, slug, image_url, genres, popularity, followers, spotify_id)
    VALUES (
      'Taylor Swift',
      'taylor-swift',
      'https://i.scdn.co/image/ab6761610000e5eb859e4c14fa59296c8649e0e4',
      ARRAY['pop', 'country'],
      100,
      95000000,
      '06HL4z0CvFAxyc27GXpf02'
    )
    RETURNING id INTO v_artist_id;
    
    v_result_text := v_result_text || 'Created Taylor Swift. ';
    
    -- Create songs for Taylor Swift
    INSERT INTO songs (artist_id, title, album, popularity, spotify_id) VALUES
    (v_artist_id, 'Anti-Hero', 'Midnights', 95, '0V3wPSX9ygBnCm8psDIegu'),
    (v_artist_id, 'Shake It Off', '1989', 92, '0cqRj7pUJDkTCEsJkx8snD'),
    (v_artist_id, 'Love Story', 'Fearless', 88, '6YYgNEZhGzo3UsKUHgfthB'),
    (v_artist_id, 'Blank Space', '1989', 90, '1p80LdxRV74UKvL8gnD7ky'),
    (v_artist_id, 'We Are Never Ever Getting Back Together', 'Red', 85, '5YqltLsjdqFtvqBT2i0Jkz');
    
    -- Insert The Weeknd
    INSERT INTO artists (name, slug, image_url, genres, popularity, followers, spotify_id)
    VALUES (
      'The Weeknd',
      'the-weeknd',
      'https://i.scdn.co/image/ab6761610000e5eb4f1c36e4c8bbf45e7f8c4c0e',
      ARRAY['r&b', 'pop'],
      98,
      50000000,
      '1Xyo4u8uXC1ZmMpatF05PJ'
    )
    RETURNING id INTO v_artist_id;
    
    v_result_text := v_result_text || 'Created The Weeknd. ';
    
    -- Create songs for The Weeknd
    INSERT INTO songs (artist_id, title, album, popularity, spotify_id) VALUES
    (v_artist_id, 'Blinding Lights', 'After Hours', 98, '0VjIjW4GlUZAMYd2vXMi3b'),
    (v_artist_id, 'The Hills', 'Beauty Behind The Madness', 85, '7fBv7CLKzipRk6EC6TWHOB'),
    (v_artist_id, 'Can''t Feel My Face', 'Beauty Behind The Madness', 88, '4iV5W9uYEdYUVa79Axb7Rh'),
    (v_artist_id, 'Starboy', 'Starboy', 92, '5aAx2yezTd8zXrkmtKl66Z'),
    (v_artist_id, 'As You Are', 'Beauty Behind The Madness', 80, '4ygLDJGtcCWqpJkHLpYlOB');
    
    -- Insert Bad Bunny
    INSERT INTO artists (name, slug, image_url, genres, popularity, followers, spotify_id)
    VALUES (
      'Bad Bunny',
      'bad-bunny',
      'https://i.scdn.co/image/ab6761610000e5eb4cabdced6a454b06f6cbb696',
      ARRAY['reggaeton', 'latin'],
      96,
      70000000,
      '4q3ewBCX7sLwd24euuV69X'
    )
    RETURNING id INTO v_artist_id;
    
    v_result_text := v_result_text || 'Created Bad Bunny. ';
    
    -- Create songs for Bad Bunny
    INSERT INTO songs (artist_id, title, album, popularity, spotify_id) VALUES
    (v_artist_id, 'Me Porto Bonito', 'Un Verano Sin Ti', 90, '6Sq7ltF9Qa7SNFBsV5Cogx'),
    (v_artist_id, 'Tití Me Preguntó', 'Un Verano Sin Ti', 88, '2hcOqCa60MgSXJV1HfEUcc'),
    (v_artist_id, 'Yonaguni', 'El Último Tour Del Mundo', 85, '7ABZLpCTkbz3gqSWnU4dO4'),
    (v_artist_id, 'Dákiti', 'El Último Tour Del Mundo', 82, '2ZZfyLt21L21y7g2LbGu9F'),
    (v_artist_id, 'La Botella', 'Un Verano Sin Ti', 78, '1mHQHQUhcqFcL6jMlDRMPF');
  END IF;
  
  -- Create sample venues if none exist
  IF (SELECT COUNT(*) FROM venues) = 0 THEN
    INSERT INTO venues (name, city, state, country, capacity, latitude, longitude, ticketmaster_id)
    VALUES 
    ('Madison Square Garden', 'New York', 'NY', 'US', 20000, 40.7505, -73.9934, 'KovZpZAJledA'),
    ('Staples Center', 'Los Angeles', 'CA', 'US', 20000, 34.0430, -118.2673, 'KovZpZAJ7eEA'),
    ('United Center', 'Chicago', 'IL', 'US', 23500, 41.8807, -87.6742, 'KovZpZA7AAEA'),
    ('American Airlines Arena', 'Miami', 'FL', 'US', 19600, 25.7814, -80.1870, 'KovZpZAkdvdA'),
    ('Barclays Center', 'Brooklyn', 'NY', 'US', 19000, 40.6826, -73.9754, 'KovZpZAk6FEA');
    
    v_result_text := v_result_text || 'Created 5 sample venues. ';
  END IF;
  
  -- Create sample shows if none exist
  IF (SELECT COUNT(*) FROM shows) = 0 THEN
    -- Get artist and venue IDs
    SELECT id INTO v_artist_id FROM artists WHERE slug = 'taylor-swift' LIMIT 1;
    SELECT id INTO v_venue_id FROM venues WHERE name = 'Madison Square Garden' LIMIT 1;
    
    -- Create upcoming shows
    FOR i IN 1..10 LOOP
      INSERT INTO shows (
        artist_id, 
        venue_id, 
        title, 
        date, 
        status, 
        min_price, 
        max_price,
        popularity,
        ticketmaster_id
      )
      VALUES (
        (SELECT id FROM artists ORDER BY RANDOM() LIMIT 1),
        (SELECT id FROM venues ORDER BY RANDOM() LIMIT 1),
        'Concert Tour 2025',
        CURRENT_DATE + (i * 7),
        'upcoming',
        49.50,
        299.99,
        80 + RANDOM() * 20,
        'TM' || LPAD(i::text, 6, '0')
      )
      RETURNING id INTO v_show_id;
      
      -- Create setlist for each show
      PERFORM create_initial_setlist(v_show_id, (SELECT artist_id FROM shows WHERE id = v_show_id));
    END LOOP;
    
    v_result_text := v_result_text || 'Created 10 sample shows with setlists. ';
  END IF;
  
  RETURN v_result_text || 'Sample data population complete!';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_initial_setlist(UUID, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION ensure_artist_has_songs(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION populate_sample_data() TO service_role;