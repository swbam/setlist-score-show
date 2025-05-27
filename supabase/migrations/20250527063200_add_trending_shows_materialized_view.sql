-- Add materialized view for trending
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_shows AS
SELECT 
  s.id AS show_id, -- Alias to avoid conflict if s also has a trending_score column
  s.artist_id,
  s.venue_id,
  s.name AS show_name,
  s.date AS show_date,
  s.status AS show_status,
  s.view_count,
  COUNT(DISTINCT v.user_id) as unique_voters,
  COALESCE(SUM(ss.votes), 0) as total_votes,
  (s.view_count * 0.3 + COALESCE(SUM(ss.votes), 0) * 0.7) as trending_score
FROM shows s
LEFT JOIN setlists sl ON sl.show_id = s.id
LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
LEFT JOIN votes v ON v.setlist_song_id = ss.id
WHERE s.date >= CURRENT_DATE -- Only include upcoming or ongoing shows
GROUP BY s.id;

COMMENT ON MATERIALIZED VIEW trending_shows IS 'Materialized view for pre-calculating trending shows based on views and votes.';

-- Refresh every hour (This function will be called by a scheduler, e.g., pg_cron or an external one)
CREATE OR REPLACE FUNCTION refresh_trending_shows_materialized_view() -- Renamed for clarity
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_trending_shows_materialized_view IS 'Refreshes the trending_shows materialized view concurrently.';