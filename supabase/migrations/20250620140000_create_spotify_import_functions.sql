-- Migrations: import Spotify artist and fetch artist shows
-- NOTE: do not DROP if already exists, use CREATE OR REPLACE

-- Function to import Spotify artist, update existing or create new
CREATE OR REPLACE FUNCTION public.import_spotify_artist(
  p_spotify_id TEXT,
  p_name TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_genres TEXT[] DEFAULT '{}',
  p_followers INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  spotify_id TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  v_artist_id UUID;
  v_slug TEXT;
BEGIN
  -- Build URL‐safe slug from name
  v_slug := LOWER(REGEXP_REPLACE(p_name, '[^a-zA-Z0-9]+', '-', 'g'));

  -- Find existing artist by spotify_id
  SELECT a.id INTO v_artist_id
  FROM artists a
  WHERE a.spotify_id = p_spotify_id;

  IF v_artist_id IS NULL THEN
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
      LEAST(ROUND(p_followers::numeric / 100000), 100),
      NOW()
    ) RETURNING artists.id INTO v_artist_id;
  ELSE
    UPDATE artists
    SET image_url      = COALESCE(p_image_url, artists.image_url),
        genres         = CASE WHEN array_length(p_genres, 1) > 0 THEN p_genres ELSE artists.genres END,
        followers      = p_followers,
        last_synced_at = NOW()
    WHERE artists.id = v_artist_id;
  END IF;

  RETURN QUERY
  SELECT a.id, a.name, a.slug, a.spotify_id
  FROM artists a
  WHERE a.id = v_artist_id;
END;
$$;

-- Function to fetch artist shows (placeholder – real implementation is handled by API job)
CREATE OR REPLACE FUNCTION public.fetch_artist_shows(
  p_artist_id UUID,
  p_artist_name TEXT
) RETURNS TABLE (
  show_id UUID,
  show_name TEXT,
  show_date TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.date
  FROM shows s
  WHERE s.artist_id = p_artist_id
    AND s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
  ORDER BY s.date;
END;
$$;

-- Grant execute to anon & service role (adjust roles as needed)
GRANT EXECUTE ON FUNCTION public.import_spotify_artist(TEXT, TEXT, TEXT, TEXT[], INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_artist_shows(UUID, TEXT) TO anon, authenticated, service_role; 