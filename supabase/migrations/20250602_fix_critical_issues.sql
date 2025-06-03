-- Fix critical issues migration
-- 20250602_fix_critical_issues.sql

-- Update artists table to ensure proper structure
-- First, handle any invalid UUID data in artist_id fields
BEGIN;

-- Update any references to invalid artist IDs in songs table
UPDATE songs 
SET artist_id = NULL 
WHERE artist_id IS NOT NULL 
AND artist_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update any references to invalid artist IDs in shows table  
UPDATE shows 
SET artist_id = NULL 
WHERE artist_id IS NOT NULL 
AND artist_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Update any references to invalid artist IDs in user_artists table
DELETE FROM user_artists 
WHERE artist_id IS NOT NULL 
AND artist_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Ensure artists table has proper columns and indexes
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS ticketmaster_name TEXT;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Remove any duplicate indexes and recreate them properly
DROP INDEX IF EXISTS idx_artists_spotify_id;
DROP INDEX IF EXISTS idx_artists_spotify_id_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_artists_spotify_id_unique ON artists(spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artists_ticketmaster_name ON artists(ticketmaster_name) WHERE ticketmaster_name IS NOT NULL;

-- Ensure proper RLS policies for anonymous voting
DROP POLICY IF EXISTS "Allow anonymous voting" ON votes;
CREATE POLICY "Allow anonymous voting" ON votes 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy for anonymous vote reading
DROP POLICY IF EXISTS "Allow anonymous vote reading" ON votes;
CREATE POLICY "Allow anonymous vote reading" ON votes 
  FOR SELECT 
  USING (true);

-- Optimize vote_limits table for anonymous users
ALTER TABLE vote_limits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE vote_limits ADD COLUMN IF NOT EXISTS anonymous_id TEXT;
CREATE INDEX IF NOT EXISTS idx_vote_limits_anonymous_id ON vote_limits(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- Add policy for anonymous vote limits
DROP POLICY IF EXISTS "Anonymous vote limits access" ON vote_limits;
CREATE POLICY "Anonymous vote limits access" ON vote_limits 
  FOR ALL 
  USING (true);

COMMIT;
