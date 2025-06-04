-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Core tables with proper constraints
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show UNIQUE (artist_id, venue_id, date)
);

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

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setlist_song_id UUID NOT NULL REFERENCES setlist_songs(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_song_vote UNIQUE (user_id, setlist_song_id),
  CONSTRAINT max_show_votes CHECK (
    (SELECT COUNT(*) FROM votes v WHERE v.user_id = votes.user_id AND v.show_id = votes.show_id) <= 10
  )
);

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

-- Indexes for performance
CREATE INDEX idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX idx_shows_artist_date ON shows(artist_id, date DESC);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at DESC);
CREATE INDEX idx_setlist_songs_votes ON setlist_songs(vote_count DESC);
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Materialized view for trending shows
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

-- RLS Policies
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can insert own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read all votes" ON votes FOR SELECT USING (true);
