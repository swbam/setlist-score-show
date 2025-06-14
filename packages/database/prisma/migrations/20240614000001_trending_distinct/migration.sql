/*
  Create trending_shows_distinct materialized view.
  Keeps only the top-ranked show per artist by trending_score.
*/

CREATE MATERIALIZED VIEW trending_shows_distinct AS
SELECT DISTINCT ON (artist_id)
  id,
  artist_id,
  venue_id,
  date,
  title,
  view_count,
  unique_voters,
  total_votes,
  recency_score,
  trending_score
FROM trending_shows
ORDER BY artist_id, trending_score DESC;

-- indexes for fast ordering
CREATE INDEX idx_trending_shows_distinct_score ON trending_shows_distinct(trending_score DESC);
CREATE INDEX idx_trending_shows_distinct_date ON trending_shows_distinct(date);

-- refresh helper
CREATE OR REPLACE FUNCTION refresh_trending_shows_distinct()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows_distinct;
END;
$$ LANGUAGE plpgsql; 