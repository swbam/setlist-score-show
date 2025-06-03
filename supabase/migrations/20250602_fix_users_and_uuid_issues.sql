-- Fix critical issues: Create users table and fix UUID problems
-- Migration: 20250602_fix_users_and_uuid_issues.sql

-- Create users table (missing table causing 406 errors)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    spotify_id TEXT UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_artists table for tracking user's followed artists
CREATE TABLE IF NOT EXISTS user_artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    rank INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, artist_id)
);

-- Fix artists table to use TEXT for spotify_id instead of trying to use it as UUID
-- First check if spotify_id column exists and fix any UUID constraints
ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_spotify_id_key;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_spotify_id_unique ON artists(spotify_id) WHERE spotify_id IS NOT NULL;

-- Fix songs table spotify_id to be TEXT (not UUID)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS spotify_id TEXT;
CREATE INDEX IF NOT EXISTS idx_songs_spotify_id ON songs(spotify_id) WHERE spotify_id IS NOT NULL;

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);

-- Add indexes for user_artists table
CREATE INDEX IF NOT EXISTS idx_user_artists_user_id ON user_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_artists_artist_id ON user_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_artists_rank ON user_artists(rank);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_artists_updated_at 
    BEFORE UPDATE ON user_artists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_artists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile" ON users 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users 
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_artists table
CREATE POLICY "Users can read own artists" ON user_artists 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artists" ON user_artists 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artists" ON user_artists 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artists" ON user_artists 
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for user_artists (for displaying user follows)
CREATE POLICY "Public read access" ON user_artists 
    FOR SELECT USING (true);

-- Allow public read access for basic user info (display names, etc.)
CREATE POLICY "Public read user info" ON users 
    FOR SELECT USING (true);
