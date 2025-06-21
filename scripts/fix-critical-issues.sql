-- =============================================
-- CRITICAL FIXES FOR THESET PLATFORM
-- =============================================

-- 1. Clean up fake sample data
DELETE FROM setlist_songs 
WHERE setlist_id IN (
  SELECT sl.id FROM setlists sl 
  JOIN shows s ON s.id = sl.show_id 
  WHERE s.title = 'Sample Concert'
);

DELETE FROM setlists 
WHERE show_id IN (
  SELECT id FROM shows WHERE title = 'Sample Concert'
);

DELETE FROM shows 
WHERE title = 'Sample Concert' OR title LIKE '%Sample%';

-- 2. Clean up orphaned venues (venues with no shows)
DELETE FROM venues 
WHERE id NOT IN (SELECT DISTINCT venue_id FROM shows WHERE venue_id IS NOT NULL);

-- 3. Update artists that have 0 shows to mark them for sync
UPDATE artists 
SET needs_spotify_sync = true,
    last_synced_at = NULL
WHERE id NOT IN (
  SELECT DISTINCT artist_id 
  FROM shows 
  WHERE artist_id IS NOT NULL
);

-- 4. Fix venue data inconsistencies
UPDATE venues 
SET city = TRIM(city),
    state = UPPER(TRIM(state))
WHERE city IS NOT NULL OR state IS NOT NULL;

-- 5. Create a function to get real artist show counts
CREATE OR REPLACE FUNCTION get_artist_show_stats()
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  upcoming_shows BIGINT,
  total_shows BIGINT,
  has_image BOOLEAN,
  needs_shows BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as artist_id,
    a.name as artist_name,
    COUNT(CASE WHEN s.status = 'upcoming' AND s.date >= CURRENT_DATE THEN 1 END) as upcoming_shows,
    COUNT(s.id) as total_shows,
    (a.image_url IS NOT NULL) as has_image,
    (COUNT(s.id) = 0) as needs_shows
  FROM artists a
  LEFT JOIN shows s ON s.artist_id = a.id
  GROUP BY a.id, a.name, a.image_url
  ORDER BY total_shows DESC, upcoming_shows DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a function to fix venue assignments
CREATE OR REPLACE FUNCTION fix_venue_assignments()
RETURNS TEXT AS $$
DECLARE
  show_record RECORD;
  venue_name_from_title TEXT;
  correct_venue_id UUID;
BEGIN
  -- Fix shows where title mentions a venue but venue_id is wrong
  FOR show_record IN 
    SELECT id, title, venue_id, artist_id
    FROM shows 
    WHERE title LIKE '%at %'
  LOOP
    -- Extract venue name from title (after "at ")
    venue_name_from_title := TRIM(SPLIT_PART(show_record.title, ' at ', 2));
    
    IF venue_name_from_title != '' THEN
      -- Look for matching venue
      SELECT id INTO correct_venue_id
      FROM venues 
      WHERE LOWER(name) = LOWER(venue_name_from_title)
      LIMIT 1;
      
      IF correct_venue_id IS NOT NULL AND correct_venue_id != show_record.venue_id THEN
        UPDATE shows 
        SET venue_id = correct_venue_id
        WHERE id = show_record.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN 'Venue assignments fixed';
END;
$$ LANGUAGE plpgsql;

-- 7. Run the venue fix
SELECT fix_venue_assignments();

-- 8. Update show statistics
UPDATE shows 
SET popularity = COALESCE(popularity, 50)
WHERE popularity IS NULL;

-- 9. Clean up artist slugs
UPDATE artists 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- 10. Ensure all upcoming shows have setlists
INSERT INTO setlists (id, show_id, created_by, name)
SELECT 
  gen_random_uuid(),
  s.id,
  'system',
  'Community Setlist'
FROM shows s
LEFT JOIN setlists sl ON sl.show_id = s.id
WHERE s.status = 'upcoming' 
  AND s.date >= CURRENT_DATE
  AND sl.id IS NULL;

-- 11. Get final statistics
SELECT 
  'CLEANUP COMPLETE' as status,
  (SELECT COUNT(*) FROM shows) as total_shows,
  (SELECT COUNT(*) FROM shows WHERE status = 'upcoming' AND date >= CURRENT_DATE) as upcoming_shows,
  (SELECT COUNT(*) FROM artists) as total_artists,
  (SELECT COUNT(*) FROM artists WHERE id IN (SELECT DISTINCT artist_id FROM shows)) as artists_with_shows,
  (SELECT COUNT(*) FROM venues) as total_venues,
  (SELECT COUNT(DISTINCT venue_id) FROM shows) as venues_with_shows; 