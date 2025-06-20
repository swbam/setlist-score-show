-- Performance indexes for TheSet platform

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_status_date_artist 
ON shows(status, date, artist_id) 
WHERE status = 'upcoming';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_date_venue_status 
ON shows(date, venue_id, status) 
WHERE status = 'upcoming';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_popularity_image 
ON artists(popularity DESC) 
WHERE image_url IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_songs_vote_count 
ON setlist_songs(vote_count DESC, setlist_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_artist_popularity 
ON songs(artist_id, popularity DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_capacity_location 
ON venues(capacity DESC) 
WHERE location IS NOT NULL;

-- Indexes for vote analytics and limits
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_show_created 
ON votes(user_id, show_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_daily 
ON votes(user_id, created_at) 
WHERE created_at >= CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_analytics_user_show 
ON vote_analytics(user_id, show_id, last_vote_at);

-- Search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_name_gin 
ON artists USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_name_gin 
ON venues USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_songs_title_gin 
ON songs USING gin(title gin_trgm_ops);

-- Sync state indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sync_state_job_status 
ON sync_state(job_name, status, updated_at);

-- User artist tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_artists_user_created 
ON user_artists(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_artists_artist_created 
ON user_artists(artist_id, created_at DESC);

-- Homepage cache indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_homepage_cache_expires 
ON homepage_cache(expires_at, cache_key);

-- Partial indexes for specific use cases
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_needs_sync 
ON artists(needs_spotify_sync, created_at) 
WHERE needs_spotify_sync = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_ticketmaster_sync 
ON shows(ticketmaster_id, updated_at) 
WHERE ticketmaster_id IS NOT NULL;

-- Foreign key indexes (if not already created by Prisma)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlists_show_id 
ON setlists(show_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_songs_setlist_id 
ON setlist_songs(setlist_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_songs_song_id 
ON setlist_songs(song_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_setlist_song_id 
ON votes(setlist_song_id);

-- Add constraints for data integrity
ALTER TABLE shows 
ADD CONSTRAINT check_show_date_future 
CHECK (date >= CURRENT_DATE - INTERVAL '1 year');

ALTER TABLE votes 
ADD CONSTRAINT check_vote_type 
CHECK (vote_type IN ('up', 'down'));

ALTER TABLE sync_state 
ADD CONSTRAINT check_sync_status 
CHECK (status IN ('idle', 'running', 'completed', 'error'));

-- Update table statistics for better query planning
ANALYZE artists;
ANALYZE shows;
ANALYZE venues;
ANALYZE songs;
ANALYZE setlists;
ANALYZE setlist_songs;
ANALYZE votes;
ANALYZE vote_analytics;
ANALYZE user_artists;
ANALYZE sync_state;
ANALYZE homepage_cache;

-- Create function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_table_statistics()
RETURNS void AS $$
BEGIN
  ANALYZE artists;
  ANALYZE shows;
  ANALYZE venues;
  ANALYZE songs;
  ANALYZE setlists;
  ANALYZE setlist_songs;
  ANALYZE votes;
  ANALYZE vote_analytics;
  ANALYZE user_artists;
  ANALYZE sync_state;
  ANALYZE homepage_cache;
  ANALYZE zip_codes;
  ANALYZE search_analytics;
END;
$$ LANGUAGE plpgsql;

-- Schedule statistics refresh (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'refresh-statistics',
      '0 2 * * *', -- Daily at 2 AM
      'SELECT refresh_table_statistics()'
    );
  END IF;
END $$;