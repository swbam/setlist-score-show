-- CreateMaterializedView for trending shows
CREATE MATERIALIZED VIEW trending_shows AS
SELECT 
  s.id,
  s.artist_id,
  s.venue_id,
  s.date,
  s.title,
  s.view_count,
  COUNT(DISTINCT v.user_id) as unique_voters,
  COUNT(v.id) as total_votes,
  AVG(CASE 
    WHEN v.created_at > NOW() - INTERVAL '24 hours' THEN 1.0
    WHEN v.created_at > NOW() - INTERVAL '3 days' THEN 0.5
    WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 0.25
    ELSE 0.1
  END) as recency_score,
  (
    COUNT(DISTINCT v.user_id) * 2 +
    COUNT(v.id) * 0.5 +
    s.view_count * 0.1 +
    AVG(CASE 
      WHEN v.created_at > NOW() - INTERVAL '24 hours' THEN 10
      WHEN v.created_at > NOW() - INTERVAL '3 days' THEN 5
      WHEN v.created_at > NOW() - INTERVAL '7 days' THEN 2
      ELSE 1
    END)
  ) as trending_score
FROM "Show" s
LEFT JOIN "Vote" v ON v.show_id = s.id
WHERE s.date >= NOW() - INTERVAL '30 days'
  AND s.status IN ('scheduled', 'active')
GROUP BY s.id, s.artist_id, s.venue_id, s.date, s.title, s.view_count;

-- Create index on trending score
CREATE INDEX idx_trending_shows_score ON trending_shows(trending_score DESC);
CREATE INDEX idx_trending_shows_date ON trending_shows(date);

-- Create function to refresh trending shows
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh every hour (using pg_cron if available)
-- This would be set up externally or via a cron job