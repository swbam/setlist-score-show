-- Enable pg_trgm extension for similarity and index support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================================================
--  MATERIALIZED VIEW: trending_artists
-- ---------------------------------------------------------
--  Purpose: store a pre-calculated "trending" score for
--  artists based on upcoming show count, vote engagement &
--  artist popularity.  This speeds up homepage / explore
--  queries and allows simple ORDER BY operations.
-- =========================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.trending_artists AS
SELECT
  a.id,
  a.name,
  a.slug,
  a.image_url,
  a.popularity,
  COUNT(DISTINCT s.id)                                AS upcoming_shows_count,
  COALESCE(SUM(ss.vote_count), 0)                     AS total_votes,
  (
    a.popularity * 0.4                   +  -- overall Spotify popularity
    COUNT(DISTINCT s.id) * 0.2           +  -- number of upcoming shows
    COALESCE(SUM(ss.vote_count), 0) * 0.4   -- community vote engagement
  )                                                 AS trending_score
FROM public.artists a
JOIN public.shows   s  ON s.artist_id = a.id
  AND s.status = 'upcoming'
  AND s.date   >= CURRENT_DATE
LEFT JOIN public.setlists       sl ON sl.show_id   = s.id
LEFT JOIN public.setlist_songs  ss ON ss.setlist_id = sl.id
GROUP BY a.id;

-- Unique & performance indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_artists_id
  ON public.trending_artists(id);
CREATE INDEX IF NOT EXISTS idx_trending_artists_score
  ON public.trending_artists(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_artists_popularity
  ON public.trending_artists(popularity DESC);

-- =========================================================
--  REFRESH FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.refresh_trending_artists()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.trending_artists;
END;$$;

GRANT SELECT  ON public.trending_artists              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_trending_artists() TO authenticated, service_role;

-- =========================================================
--  CRON SCHEDULE (hourly)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'refresh-trending-artists',
  '0 * * * *',
  'SELECT public.refresh_trending_artists()'
) ON CONFLICT DO NOTHING;

-- Initial population
SELECT public.refresh_trending_artists(); 