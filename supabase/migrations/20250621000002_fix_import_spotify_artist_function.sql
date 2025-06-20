-- Fix import_spotify_artist function to match API call signature

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.import_spotify_artist(TEXT, TEXT, TEXT, TEXT[], INTEGER);

-- Recreate with correct signature including popularity parameter
CREATE OR REPLACE FUNCTION public.import_spotify_artist(
  p_spotify_id TEXT,
  p_name TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_genres TEXT[] DEFAULT '{}',
  p_followers INTEGER DEFAULT 0,
  p_popularity INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  spotify_id TEXT,
  already_existed BOOLEAN,
  songs_imported INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  v_artist_id UUID;
  v_slug TEXT;
  v_existed BOOLEAN := false;
  v_songs_count INTEGER := 0;
BEGIN
  -- Build URL-safe slug from name
  v_slug := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  
  -- Remove leading/trailing dashes
  v_slug := TRIM(BOTH '-' FROM v_slug);
  
  -- Ensure slug is not empty
  IF v_slug = '' THEN
    v_slug := 'artist-' || LOWER(SUBSTRING(p_spotify_id, 1, 8));
  END IF;

  -- Find existing artist by spotify_id
  SELECT a.id INTO v_artist_id
  FROM artists a
  WHERE a.spotify_id = p_spotify_id;

  IF v_artist_id IS NULL THEN
    -- Create new artist
    INSERT INTO artists (
      spotify_id,
      name,
      slug,
      image_url,
      genres,
      followers,
      popularity,
      last_synced_at
    ) VALUES (
      p_spotify_id,
      p_name,
      v_slug,
      p_image_url,
      p_genres,
      p_followers,
      p_popularity,
      NOW()
    ) RETURNING artists.id INTO v_artist_id;
    
    v_existed := false;
  ELSE
    -- Update existing artist
    UPDATE artists
    SET image_url      = COALESCE(p_image_url, artists.image_url),
        genres         = CASE WHEN array_length(p_genres, 1) > 0 THEN p_genres ELSE artists.genres END,
        followers      = p_followers,
        popularity     = p_popularity,
        last_synced_at = NOW()
    WHERE artists.id = v_artist_id;
    
    v_existed := true;
  END IF;
  
  -- Ensure artist has some songs for potential setlist creation
  SELECT COUNT(*) INTO v_songs_count
  FROM songs
  WHERE artist_id = v_artist_id;
  
  -- If no songs exist, create some placeholder songs
  IF v_songs_count = 0 THEN
    PERFORM ensure_artist_has_songs(v_artist_id);
    v_songs_count := 5; -- ensure_artist_has_songs creates 5 songs
  END IF;

  RETURN QUERY
  SELECT a.id, a.name, a.slug, a.spotify_id, v_existed, v_songs_count::INTEGER
  FROM artists a
  WHERE a.id = v_artist_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.import_spotify_artist(TEXT, TEXT, TEXT, TEXT[], INTEGER, INTEGER) TO anon, authenticated, service_role;