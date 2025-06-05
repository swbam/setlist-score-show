-- Complete database schema for setlist score show
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
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

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show UNIQUE (artist_id, venue_id, date)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
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

-- Setlists table
CREATE TABLE IF NOT EXISTS setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Set',
  order_index INTEGER DEFAULT 0,
  is_encore BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show_setlist UNIQUE (show_id, order_index)
);

-- Setlist songs table
CREATE TABLE IF NOT EXISTS setlist_songs (
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setlist_song_id UUID NOT NULL REFERENCES setlist_songs(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_song_vote UNIQUE (user_id, setlist_song_id)
);

-- Vote analytics table
CREATE TABLE IF NOT EXISTS vote_analytics (
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

-- Sync history table
CREATE TABLE IF NOT EXISTS sync_history (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX IF NOT EXISTS idx_shows_artist_date ON shows(artist_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_votes_user_created ON votes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes ON setlist_songs(vote_count DESC);

-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY IF NOT EXISTS "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read access" ON setlist_songs FOR SELECT USING (true);

-- RLS Policies for users
CREATE POLICY IF NOT EXISTS "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can insert own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can read all votes" ON votes FOR SELECT USING (true);