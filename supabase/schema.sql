-- TheSet Database Schema
-- Run this script in your Supabase SQL editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    spotify_id TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create artists table
CREATE TABLE IF NOT EXISTS public.artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    popularity INTEGER,
    genres TEXT[],
    spotify_url TEXT,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT NOT NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC
);

-- Create shows table
CREATE TABLE IF NOT EXISTS public.shows (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    venue_id TEXT NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'postponed', 'canceled')),
    ticketmaster_url TEXT,
    view_count INTEGER DEFAULT 0
);

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    album TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    popularity INTEGER NOT NULL DEFAULT 0,
    spotify_url TEXT NOT NULL
);

-- Create setlists table
CREATE TABLE IF NOT EXISTS public.setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id TEXT NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(show_id)
);

-- Create setlist_songs table
CREATE TABLE IF NOT EXISTS public.setlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    votes INTEGER DEFAULT 0
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    setlist_song_id UUID NOT NULL REFERENCES public.setlist_songs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, setlist_song_id)
);

-- Create played_setlists table
CREATE TABLE IF NOT EXISTS public.played_setlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id TEXT NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    setlist_fm_id TEXT NOT NULL,
    played_date TIMESTAMP WITH TIME ZONE NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(show_id)
);

-- Create played_setlist_songs table
CREATE TABLE IF NOT EXISTS public.played_setlist_songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    played_setlist_id UUID NOT NULL REFERENCES public.played_setlists(id) ON DELETE CASCADE,
    song_id TEXT NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER NOT NULL
);

-- Create user_artists table
CREATE TABLE IF NOT EXISTS public.user_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    UNIQUE(user_id, artist_id)
);

-- Create artist_mappings table for mapping between Ticketmaster and Spotify IDs
CREATE TABLE IF NOT EXISTS public.artist_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_name TEXT NOT NULL,
    spotify_id TEXT REFERENCES public.artists(id),
    ticketmaster_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(spotify_id, ticketmaster_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_artist_id ON public.shows(artist_id);
CREATE INDEX IF NOT EXISTS idx_shows_venue_id ON public.shows(venue_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON public.shows(date);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON public.songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON public.setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_song_id ON public.setlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_setlist_song_id ON public.votes(setlist_song_id);
CREATE INDEX IF NOT EXISTS idx_user_artists_user_id ON public.user_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artists_artist_id ON public.user_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_mappings_spotify_id ON public.artist_mappings(spotify_id);
CREATE INDEX IF NOT EXISTS idx_artist_mappings_ticketmaster_id ON public.artist_mappings(ticketmaster_id);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.played_setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.played_setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_mappings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Artists table policies (public read)
CREATE POLICY "Anyone can view artists" ON public.artists
    FOR SELECT USING (true);

CREATE POLICY "System can manage artists" ON public.artists
    FOR ALL USING (true);

-- Venues table policies (public read)
CREATE POLICY "Anyone can view venues" ON public.venues
    FOR SELECT USING (true);

CREATE POLICY "System can manage venues" ON public.venues
    FOR ALL USING (true);

-- Shows table policies (public read)
CREATE POLICY "Anyone can view shows" ON public.shows
    FOR SELECT USING (true);

CREATE POLICY "System can manage shows" ON public.shows
    FOR ALL USING (true);

-- Songs table policies (public read)
CREATE POLICY "Anyone can view songs" ON public.songs
    FOR SELECT USING (true);

CREATE POLICY "System can manage songs" ON public.songs
    FOR ALL USING (true);

-- Setlists table policies (public read)
CREATE POLICY "Anyone can view setlists" ON public.setlists
    FOR SELECT USING (true);

CREATE POLICY "System can manage setlists" ON public.setlists
    FOR ALL USING (true);

-- Setlist songs table policies (public read)
CREATE POLICY "Anyone can view setlist songs" ON public.setlist_songs
    FOR SELECT USING (true);

CREATE POLICY "System can manage setlist songs" ON public.setlist_songs
    FOR ALL USING (true);

-- Votes table policies
CREATE POLICY "Users can view all votes" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON public.votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

-- Played setlists table policies (public read)
CREATE POLICY "Anyone can view played setlists" ON public.played_setlists
    FOR SELECT USING (true);

CREATE POLICY "System can manage played setlists" ON public.played_setlists
    FOR ALL USING (true);

-- Played setlist songs table policies (public read)
CREATE POLICY "Anyone can view played setlist songs" ON public.played_setlist_songs
    FOR SELECT USING (true);

CREATE POLICY "System can manage played setlist songs" ON public.played_setlist_songs
    FOR ALL USING (true);

-- User artists table policies
CREATE POLICY "Users can view all user artists" ON public.user_artists
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own artists" ON public.user_artists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artists" ON public.user_artists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artists" ON public.user_artists
    FOR DELETE USING (auth.uid() = user_id);

-- Artist mappings table policies (public read, system write)
CREATE POLICY "Anyone can view artist mappings" ON public.artist_mappings
    FOR SELECT USING (true);

CREATE POLICY "System can manage artist mappings" ON public.artist_mappings
    FOR ALL USING (true);

-- Create functions
CREATE OR REPLACE FUNCTION public.get_or_create_setlist(show_id TEXT)
RETURNS UUID AS $$
DECLARE
    setlist_id UUID;
BEGIN
    -- Try to get existing setlist
    SELECT id INTO setlist_id FROM public.setlists WHERE show_id = $1;
    
    -- If not found, create new one
    IF setlist_id IS NULL THEN
        INSERT INTO public.setlists (show_id) VALUES ($1) RETURNING id INTO setlist_id;
    END IF;
    
    RETURN setlist_id;
END;
$$ LANGUAGE plpgsql;

-- Create vote_for_song function
CREATE OR REPLACE FUNCTION public.vote_for_song(setlist_song_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_id UUID;
    result JSONB;
BEGIN
    -- Get the current user
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    -- Try to insert vote
    BEGIN
        INSERT INTO public.votes (user_id, setlist_song_id) VALUES (user_id, setlist_song_id);
        
        -- Update vote count
        UPDATE public.setlist_songs 
        SET votes = votes + 1 
        WHERE id = setlist_song_id;
        
        RETURN jsonb_build_object('success', true);
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already voted');
    END;
END;
$$ LANGUAGE plpgsql;

-- Create match_song_similarity function
CREATE OR REPLACE FUNCTION public.match_song_similarity(
    p_artist_id TEXT,
    p_song_name TEXT,
    p_similarity_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE(id TEXT, name TEXT, similarity NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        similarity(s.name, p_song_name) AS similarity
    FROM public.songs s
    WHERE s.artist_id = p_artist_id
    AND similarity(s.name, p_song_name) >= p_similarity_threshold
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigger to update setlist updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON public.setlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 