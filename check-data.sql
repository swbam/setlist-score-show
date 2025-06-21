-- Check current data in the database
SELECT 'artists' as table_name, COUNT(*) as count FROM artists
UNION ALL
SELECT 'venues' as table_name, COUNT(*) as count FROM venues  
UNION ALL
SELECT 'shows' as table_name, COUNT(*) as count FROM shows
UNION ALL
SELECT 'songs' as table_name, COUNT(*) as count FROM songs
UNION ALL
SELECT 'setlists' as table_name, COUNT(*) as count FROM setlists
UNION ALL
SELECT 'setlist_songs' as table_name, COUNT(*) as count FROM setlist_songs
ORDER BY table_name;