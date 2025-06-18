-- Final schema fix for critical missing columns

-- Ensure all required columns exist in artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS setlistfm_mbid TEXT;

-- Ensure all required columns exist in shows table  
ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Update shows.start_time and end_time from date if they are null
UPDATE shows 
SET 
  start_time = date::timestamptz,
  end_time = (date::timestamptz + INTERVAL '3 hours')
WHERE start_time IS NULL AND date IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artists_setlistfm_mbid ON artists(setlistfm_mbid);
CREATE INDEX IF NOT EXISTS idx_shows_title ON shows(title);
CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time);

-- Ensure foreign key relationships exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'shows_artist_id_fkey' 
        AND table_name = 'shows'
    ) THEN
        ALTER TABLE shows 
        ADD CONSTRAINT shows_artist_id_fkey 
        FOREIGN KEY (artist_id) REFERENCES artists(id);
    END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN artists.setlistfm_mbid IS 'Setlist.fm MusicBrainz ID for external API integration';
COMMENT ON COLUMN shows.title IS 'Display title for the show';
COMMENT ON COLUMN shows.start_time IS 'Show start time with timezone';
COMMENT ON COLUMN shows.end_time IS 'Show end time with timezone'; 