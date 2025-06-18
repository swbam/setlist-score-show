-- Fix critical database schema mismatches for artist and show pages to work

-- 1. Add missing title column to shows table (critical for show pages)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE shows SET title = name WHERE title IS NULL OR title = '';

-- 2. Add missing columns for Prisma compatibility
ALTER TABLE shows ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;
UPDATE shows SET start_time = date WHERE start_time IS NULL AND date IS NOT NULL;

-- 3. Add missing setlistfm_mbid column to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS setlistfm_mbid TEXT UNIQUE;

-- 4. Verify the fix worked
SELECT 'SHOWS FIXED - Title column added' as status, COUNT(*) as shows_with_title 
FROM shows WHERE title IS NOT NULL AND title != '';

SELECT 'ARTISTS FIXED - setlistfm_mbid column added' as status, COUNT(*) as artists_total
FROM artists; 