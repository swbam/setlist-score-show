-- Drop existing views if they exist
DROP VIEW IF EXISTS trending_shows CASCADE;
DROP MATERIALIZED VIEW IF EXISTS trending_shows CASCADE;
DROP MATERIALIZED VIEW IF EXISTS trending_shows_view CASCADE;

-- Create materialized view for trending shows with fixed date calculation
CREATE MATERIALIZED VIEW trending_shows_view AS
WITH show_stats AS (
  SELECT 
    s.id,
    s.date,
    s.title,
    s.status,
    s.view_count,
    s.artist_id,
    s.venue_id,
    COUNT(DISTINCT v.id) as total_votes,
    COUNT(DISTINCT v.user_id) as unique_voters,
    (s.date - CURRENT_DATE) as days_until_show
  FROM shows s
  LEFT JOIN setlists sl ON sl.show_id = s.id
  LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
  LEFT JOIN votes v ON v.setlist_song_id = ss.id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND s.date <= CURRENT_DATE + INTERVAL '180 days'
  GROUP BY s.id
)
SELECT 
  ss.*,
  calculate_trending_score(
    ss.total_votes::INT,
    ss.unique_voters::INT,
    ss.days_until_show::INT,
    ss.view_count::INT
  ) as trending_score
FROM show_stats ss
WHERE ss.total_votes > 0 OR ss.view_count > 0
ORDER BY trending_score DESC;

-- Create regular view alias
CREATE VIEW trending_shows AS
SELECT 
  id as show_id,
  date,
  title,
  status,
  view_count,
  artist_id,
  venue_id,
  total_votes::INT,
  unique_voters::INT,
  trending_score
FROM trending_shows_view;

-- Grant permissions
GRANT SELECT ON trending_shows_view TO anon, authenticated;
GRANT SELECT ON trending_shows TO anon, authenticated;

-- Create index on materialized view
CREATE INDEX idx_trending_shows_score ON trending_shows_view(trending_score DESC);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW trending_shows_view;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION refresh_trending_shows() TO authenticated, service_role;