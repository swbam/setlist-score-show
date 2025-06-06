-- Complete Database Setup for Setlist Score Show
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS vote_analytics CASCADE;
DROP TABLE IF EXISTS setlist_songs CASCADE;
DROP TABLE IF EXISTS setlists CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sync_history CASCADE;
DROP MATERIALIZED VIEW IF EXISTS trending_shows CASCADE;

-- Create artists table
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_id TEXT UNIQUE,
  ticketmaster_id TEXT,
  setlistfm_mbid TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  genres TEXT[],
  popularity INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_ids UNIQUE NULLS NOT DISTINCT (spotify_id, ticketmaster_id)
);

-- Create venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticketmaster_id TEXT UNIQUE,
  setlistfm_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shows table
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  ticketmaster_id TEXT UNIQUE,
  setlistfm_id TEXT UNIQUE,
  date DATE NOT NULL,
  start_time TIME,
  doors_time TIME,
  title TEXT,
  tour_name TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  ticketmaster_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- trending_score column removed as we are using the materialized view
  CONSTRAINT unique_show UNIQUE (artist_id, venue_id, date)
);

-- Create songs table
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  spotify_id TEXT UNIQUE,
  musicbrainz_id TEXT UNIQUE,
  title TEXT NOT NULL,
  album TEXT,
  album_image_url TEXT,
  duration_ms INTEGER,
  popularity INTEGER DEFAULT 0,
  preview_url TEXT,
  spotify_url TEXT,
  audio_features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_song UNIQUE (artist_id, title, album)
);

-- Create setlists table
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Set',
  order_index INTEGER DEFAULT 0,
  is_encore BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show_setlist UNIQUE (show_id, order_index)
);

-- Create setlist_songs table
CREATE TABLE setlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  vote_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_setlist_position UNIQUE (setlist_id, position),
  CONSTRAINT unique_setlist_song UNIQUE (setlist_id, song_id)
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setlist_song_id UUID NOT NULL REFERENCES setlist_songs(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_song_vote UNIQUE (user_id, setlist_song_id)
);

-- Create vote_analytics table
CREATE TABLE vote_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  daily_votes INTEGER DEFAULT 0,
  show_votes INTEGER DEFAULT 0,
  last_vote_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_show_analytics UNIQUE (user_id, show_id)
);

-- Create sync_history table
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes for performance
CREATE INDEX idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX idx_shows_artist_date ON shows(artist_id, date DESC);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at DESC);
CREATE INDEX idx_setlist_songs_votes ON setlist_songs(vote_count DESC);
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Create materialized view for trending shows
CREATE MATERIALIZED VIEW trending_shows AS
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
    s.view_count * 0.3 + 
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

CREATE UNIQUE INDEX idx_trending_shows_id ON trending_shows(show_id);

-- Enable Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Public read access
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlist_songs FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read all votes" ON votes FOR SELECT USING (true);

-- Function to refresh trending shows
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_setlist_songs_updated_at BEFORE UPDATE ON setlist_songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vote_analytics_updated_at BEFORE UPDATE ON vote_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create analytics_events table for tracking (optional)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some initial test data
-- Insert a test artist
INSERT INTO artists (name, slug, spotify_id, genres, popularity, followers)
VALUES
  ('The Beatles', 'the-beatles', '3WrFJ7ztbogyGnTHbHJFl2', ARRAY['rock', 'pop'], 90, 25000000),
  ('Pink Floyd', 'pink-floyd', '0k17h0D3J5VfsdmQ1iZtE9', ARRAY['rock', 'progressive rock'], 85, 15000000);

-- Insert test venues
INSERT INTO venues (name, city, state, country, capacity)
VALUES
  ('Madison Square Garden', 'New York', 'NY', 'USA', 20000),
  ('The Hollywood Bowl', 'Los Angeles', 'CA', 'USA', 17500);

-- Insert test shows
-- Note: We need to select the artist_id and venue_id from the newly inserted rows
-- This is a simplified approach for test data. For production, you'd handle this more robustly.
INSERT INTO shows (artist_id, venue_id, date, title, status)
VALUES
  ((SELECT id from artists WHERE name = 'The Beatles'), (SELECT id from venues WHERE name = 'Madison Square Garden'), CURRENT_DATE + INTERVAL '30 days', 'The Beatles Revival Tour', 'upcoming'),
  ((SELECT id from artists WHERE name = 'Pink Floyd'), (SELECT id from venues WHERE name = 'The Hollywood Bowl'), CURRENT_DATE + INTERVAL '45 days', 'Pink Floyd Experience', 'upcoming');

-- Insert test songs
INSERT INTO songs (artist_id, title, album, spotify_id, duration_ms, popularity)
VALUES
  ((SELECT id from artists WHERE name = 'The Beatles'), 'Hey Jude', 'The Beatles (White Album)', '0aym2LBJBk9DAYuHHutrIl', 431333, 85),
  ((SELECT id from artists WHERE name = 'The Beatles'), 'Let It Be', 'Let It Be', '7iN1s7xHE4ifF5povM6A48', 243026, 82),
  ((SELECT id from artists WHERE name = 'Pink Floyd'), 'Comfortably Numb', 'The Wall', '5HNCy40Ni5BZJFw1TKzRsC', 382296, 88),
  ((SELECT id from artists WHERE name = 'Pink Floyd'), 'Wish You Were Here', 'Wish You Were Here', '6mFkJmJqdDVQ1REhVfGgd1', 334743, 86);

-- Insert test setlists
INSERT INTO setlists (show_id, name, order_index)
VALUES
  ((SELECT id from shows WHERE title = 'The Beatles Revival Tour'), 'Main Set', 0),
  ((SELECT id from shows WHERE title = 'Pink Floyd Experience'), 'Main Set', 0);

-- Insert test setlist songs
INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
VALUES
  ((SELECT id from setlists WHERE show_id = (SELECT id from shows WHERE title = 'The Beatles Revival Tour')), (SELECT id from songs WHERE title = 'Hey Jude'), 1, 0),
  ((SELECT id from setlists WHERE show_id = (SELECT id from shows WHERE title = 'The Beatles Revival Tour')), (SELECT id from songs WHERE title = 'Let It Be'), 2, 0),
  ((SELECT id from setlists WHERE show_id = (SELECT id from shows WHERE title = 'Pink Floyd Experience')), (SELECT id from songs WHERE title = 'Comfortably Numb'), 1, 0),
  ((SELECT id from setlists WHERE show_id = (SELECT id from shows WHERE title = 'Pink Floyd Experience')), (SELECT id from songs WHERE title = 'Wish You Were Here'), 2, 0);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW trending_shows;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully!' as status;