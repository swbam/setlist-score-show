-- Add missing critical columns that are causing API crashes

-- Add missing columns to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS setlistfm_mbid TEXT;

-- Add missing columns to shows table
ALTER TABLE shows 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Check if name column exists in shows table and update title if it does
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'name') THEN
        UPDATE shows 
        SET title = name 
        WHERE title IS NULL AND name IS NOT NULL;
    END IF;
END $$;

-- Update shows.start_time and end_time from shows.date with proper casting
UPDATE shows 
SET 
  start_time = date::timestamptz,
  end_time = (date::timestamptz + INTERVAL '3 hours')
WHERE start_time IS NULL AND date IS NOT NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_artists_setlistfm_mbid ON artists(setlistfm_mbid);
CREATE INDEX IF NOT EXISTS idx_shows_title ON shows(title);
CREATE INDEX IF NOT EXISTS idx_shows_start_time ON shows(start_time); 