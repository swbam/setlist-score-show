-- Fix Critical Database Schema Issues
-- This migration addresses all the schema problems identified in the outline

-- 1. Create user_profiles table for additional user data (references auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to existing tables
ALTER TABLE setlist_songs 
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS show_id UUID;

-- Add foreign key constraint for show_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_show_id_fkey'
  ) THEN
    ALTER TABLE votes 
    ADD CONSTRAINT votes_show_id_fkey 
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create unique constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_artist_ids 
ON artists(spotify_id, ticketmaster_id) 
NULLS NOT DISTINCT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_show 
ON shows(artist_id, venue_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_show_setlist 
ON setlists(show_id, order_index);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_setlist_position 
ON setlist_songs(setlist_id, position);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_setlist_song 
ON setlist_songs(setlist_id, song_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_song_vote 
ON votes(user_id, setlist_song_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_artist_song 
ON songs(artist_id, title, album) 
WHERE album IS NOT NULL;

-- 4. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_shows_date_status 
ON shows(date, status) 
WHERE status = 'upcoming';

CREATE INDEX IF NOT EXISTS idx_shows_artist_date 
ON shows(artist_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_votes_user_created 
ON votes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_show_id 
ON votes(show_id);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes 
ON setlist_songs(vote_count DESC);

CREATE INDEX IF NOT EXISTS idx_songs_artist_title 
ON songs(artist_id, title);

CREATE INDEX IF NOT EXISTS idx_artists_slug 
ON artists(slug);

-- 5. Create vote analytics table
CREATE TABLE IF NOT EXISTS vote_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  daily_votes INTEGER DEFAULT 0,
  show_votes INTEGER DEFAULT 0,
  last_vote_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_show_analytics UNIQUE (user_id, show_id)
);

-- 6. Create sync history table
CREATE TABLE IF NOT EXISTS sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('setlistfm', 'spotify', 'ticketmaster')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'show', 'song', 'setlist')),
  entity_id UUID,
  external_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  error_message TEXT,
  items_processed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 7. Add missing columns to shows table
ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tour_name TEXT;

-- 8. Add missing columns to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audio_features JSONB;

-- 9. Add missing columns to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NOW();

-- 10. Create function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE setlist_songs 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.setlist_song_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE setlist_songs 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.setlist_song_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic vote count updates
DROP TRIGGER IF EXISTS update_vote_count_trigger ON votes;
CREATE TRIGGER update_vote_count_trigger
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_count();

-- 11. Create function to sync existing vote counts
CREATE OR REPLACE FUNCTION sync_vote_counts()
RETURNS void AS $$
BEGIN
  UPDATE setlist_songs ss
  SET vote_count = (
    SELECT COUNT(*) 
    FROM votes v 
    WHERE v.setlist_song_id = ss.id
  );
END;
$$ LANGUAGE plpgsql;

-- Run the sync
SELECT sync_vote_counts();

-- 12. Create function to populate show_id in votes from setlist_songs
CREATE OR REPLACE FUNCTION populate_vote_show_ids()
RETURNS void AS $$
BEGIN
  UPDATE votes v
  SET show_id = s.show_id
  FROM setlist_songs ss
  JOIN setlists sl ON ss.setlist_id = sl.id
  JOIN shows s ON sl.show_id = s.id
  WHERE v.setlist_song_id = ss.id
  AND v.show_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Run the population
SELECT populate_vote_show_ids();

-- 13. Make show_id NOT NULL after population
ALTER TABLE votes 
ALTER COLUMN show_id SET NOT NULL;

-- 14. Create materialized view for trending shows
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_shows AS
SELECT 
  s.id as show_id,
  s.artist_id,
  s.venue_id,
  s.date as show_date,
  s.title as show_name,
  s.status as show_status,
  s.view_count,
  COALESCE(vote_stats.total_votes, 0) as total_votes,
  COALESCE(vote_stats.unique_voters, 0) as unique_voters,
  COALESCE(vote_stats.avg_votes_per_song, 0) as avg_votes_per_song,
  (
    COALESCE(s.view_count, 0) * 0.3 + 
    COALESCE(vote_stats.total_votes, 0) * 0.4 +
    COALESCE(vote_stats.unique_voters, 0) * 0.3
  ) * 
  CASE 
    WHEN s.date <= CURRENT_DATE + INTERVAL '7 days' THEN 2.0
    WHEN s.date <= CURRENT_DATE + INTERVAL '30 days' THEN 1.5
    WHEN s.date <= CURRENT_DATE + INTERVAL '90 days' THEN 1.0
    ELSE 0.5
  END as trending_score
FROM shows s
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT v.id) as total_votes,
    COUNT(DISTINCT v.user_id) as unique_voters,
    AVG(ss.vote_count) as avg_votes_per_song
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists sl ON ss.setlist_id = sl.id
  WHERE sl.show_id = s.id
) vote_stats ON true
WHERE s.date >= CURRENT_DATE
AND s.status != 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_shows_id ON trending_shows(show_id);
CREATE INDEX IF NOT EXISTS idx_trending_shows_score ON trending_shows(trending_score DESC);

-- 15. Create function to refresh trending shows
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

-- 16. Update RLS policies for new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile data
CREATE POLICY "Users can read own profile" ON user_profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can read their own analytics
CREATE POLICY "Users can read own analytics" ON vote_analytics 
FOR SELECT USING (auth.uid() = user_id);

-- Sync history is admin only (no public policies)

-- 17. Create indexes for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_songs_title_trgm 
ON songs USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_artists_name_trgm 
ON artists USING gin(name gin_trgm_ops);

-- 18. Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vote_analytics_updated_at BEFORE UPDATE ON vote_analytics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 19. Create function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  SELECT NEW.id
  WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users to sync with our user_profiles table
CREATE OR REPLACE TRIGGER sync_auth_users_profiles
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION ensure_user_profile_exists();

-- 20. Add check constraint for vote limits
ALTER TABLE votes 
DROP CONSTRAINT IF EXISTS max_show_votes;

-- Note: This constraint needs to be implemented at the application level
-- as PostgreSQL doesn't support subqueries in CHECK constraints

-- 21. Create composite index for vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_user_show 
ON votes(user_id, show_id);

-- 22. Add missing fields to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Database schema fixes applied successfully!';
END $$;