-- Create RPC function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count(setlist_song_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE setlist_songs
  SET vote_count = vote_count + 1
  WHERE id = setlist_song_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  total_votes INT,
  unique_voters INT,
  days_until_show INT,
  view_count INT DEFAULT 0
)
RETURNS FLOAT AS $$
DECLARE
  recency_weight FLOAT := 1.0;
  urgency_weight FLOAT := 1.0;
  popularity_weight FLOAT := 1.0;
  engagement_weight FLOAT := 1.0;
  score FLOAT;
BEGIN
  -- Recency weight: favor shows happening soon
  IF days_until_show <= 7 THEN
    urgency_weight := 2.0;
  ELSIF days_until_show <= 14 THEN
    urgency_weight := 1.5;
  ELSIF days_until_show <= 30 THEN
    urgency_weight := 1.2;
  END IF;

  -- Engagement weight: ratio of unique voters to total votes
  IF total_votes > 0 THEN
    engagement_weight := 1.0 + (unique_voters::FLOAT / total_votes::FLOAT);
  END IF;

  -- Popularity weight based on view count
  IF view_count > 1000 THEN
    popularity_weight := 1.5;
  ELSIF view_count > 500 THEN
    popularity_weight := 1.3;
  ELSIF view_count > 100 THEN
    popularity_weight := 1.1;
  END IF;

  -- Calculate final score
  score := (total_votes * urgency_weight * engagement_weight * popularity_weight);
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for trending shows
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_shows_view AS
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
    EXTRACT(DAY FROM (s.date - CURRENT_DATE)) as days_until_show
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

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_trending_shows_score ON trending_shows_view(trending_score DESC);

-- Create function to refresh trending shows
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows_view;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON trending_shows_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_vote_count TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_trending_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_trending_shows TO service_role;