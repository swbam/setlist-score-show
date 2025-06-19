-- Create user_artists table for tracking followed artists
CREATE TABLE IF NOT EXISTS user_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'manual', -- 'manual', 'spotify_import', 'recommendation'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Create indexes
CREATE INDEX idx_user_artists_user_id ON user_artists(user_id);
CREATE INDEX idx_user_artists_artist_id ON user_artists(artist_id);
CREATE INDEX idx_user_artists_created_at ON user_artists(created_at DESC);

-- Add admin role to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role != 'user';

-- Add missing columns to shows table
ALTER TABLE shows
ADD COLUMN IF NOT EXISTS popularity INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS tickets_url TEXT;

-- Add needs_spotify_sync to artists if not exists
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS needs_spotify_sync BOOLEAN DEFAULT false;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_shows_popularity ON shows(popularity DESC) WHERE status = 'upcoming';
CREATE INDEX IF NOT EXISTS idx_artists_needs_sync ON artists(needs_spotify_sync) WHERE needs_spotify_sync = true;
CREATE INDEX IF NOT EXISTS idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';

-- Grant permissions
GRANT ALL ON user_artists TO authenticated;
GRANT SELECT ON user_artists TO anon;

-- Enable RLS
ALTER TABLE user_artists ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_artists
CREATE POLICY "Users can view their own followed artists" ON user_artists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can follow artists" ON user_artists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow artists" ON user_artists
  FOR DELETE USING (auth.uid() = user_id);

-- Function to track user artist relationship
CREATE OR REPLACE FUNCTION track_user_artist(
  p_user_id UUID,
  p_artist_id UUID,
  p_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_artists (user_id, artist_id, source)
  VALUES (p_user_id, p_artist_id, p_source)
  ON CONFLICT (user_id, artist_id) 
  DO UPDATE SET 
    updated_at = NOW(),
    source = EXCLUDED.source
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION track_user_artist(UUID, UUID, TEXT) TO authenticated;