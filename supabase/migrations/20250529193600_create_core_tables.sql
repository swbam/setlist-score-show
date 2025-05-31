-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    spotify_id TEXT UNIQUE,
    ticketmaster_id TEXT,
    ticketmaster_name TEXT,
    image_url TEXT,
    genres TEXT[],
    popularity INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shows table
CREATE TABLE IF NOT EXISTS shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    title TEXT,
    tour_name TEXT,
    setlistfm_id TEXT UNIQUE,
    ticketmaster_id TEXT,
    view_count INTEGER DEFAULT 0,
    trending_score DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    spotify_id TEXT,
    duration_ms INTEGER,
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlists table
CREATE TABLE IF NOT EXISTS setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Main Set',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlist_songs table
CREATE TABLE IF NOT EXISTS setlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    is_encore BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    setlist_song_id UUID REFERENCES setlist_songs(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setlist_song_id)
);

-- Create vote_limits table
CREATE TABLE IF NOT EXISTS vote_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
    votes_used INTEGER DEFAULT 0,
    max_votes INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, show_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artists_ticketmaster_id ON artists(ticketmaster_id);

CREATE INDEX IF NOT EXISTS idx_shows_artist_id ON shows(artist_id);
CREATE INDEX IF NOT EXISTS idx_shows_venue_id ON shows(venue_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_setlistfm_id ON shows(setlistfm_id);
CREATE INDEX IF NOT EXISTS idx_shows_trending_score ON shows(trending_score DESC);

CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id);

CREATE INDEX IF NOT EXISTS idx_setlists_show_id ON setlists(show_id);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_song_id ON setlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_position ON setlist_songs(position);

CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_setlist_song_id ON votes(setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);

CREATE INDEX IF NOT EXISTS idx_vote_limits_user_id ON vote_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_vote_limits_show_id ON vote_limits(show_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_setlist_songs_updated_at BEFORE UPDATE ON setlist_songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vote_limits_updated_at BEFORE UPDATE ON vote_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlist_songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON votes FOR SELECT USING (true);

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can insert" ON votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update own votes" ON votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete own votes" ON votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert" ON vote_limits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update own limits" ON vote_limits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public read access" ON vote_limits FOR SELECT USING (true);