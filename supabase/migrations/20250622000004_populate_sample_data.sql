-- Populate sample data for homepage functionality
-- This ensures the RPC functions return data

-- Create sample artists if none exist
INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Taylor Swift',
  'taylor-swift',
  'https://i.scdn.co/image/ab6761610000e5eb859e4c14fa59296c8649e0e4',
  ARRAY['pop', 'country'],
  100,
  95000000,
  '06HL4z0CvFAxyc27GXpf02',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'taylor-swift');

INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'The Weeknd',
  'the-weeknd',
  'https://i.scdn.co/image/ab6761610000e5eb4f1c77dd7a2fe4c6b3f3f03f',
  ARRAY['r&b', 'pop'],
  98,
  50000000,
  '1Xyo4u8uXC1ZmMpatF05PJ',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'the-weeknd');

INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Bad Bunny',
  'bad-bunny',
  'https://i.scdn.co/image/ab6761610000e5eb4cabdced6a454b06f6cbb696',
  ARRAY['reggaeton', 'latin'],
  96,
  70000000,
  '4q3ewBCX7sLwd24euuV69X',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'bad-bunny');

INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Ariana Grande',
  'ariana-grande',
  'https://i.scdn.co/image/ab6761610000e5eb40b5c07ab77b6b1a9075fdc0',
  ARRAY['pop', 'r&b'],
  94,
  55000000,
  '66CXWjxzNUsdJxJ2JdwvnR',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'ariana-grande');

INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Drake',
  'drake',
  'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
  ARRAY['hip-hop', 'rap'],
  99,
  85000000,
  '3TVXtAsR1Inumwj472S9r4',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM artists WHERE slug = 'drake');

-- Create sample venues if none exist  
INSERT INTO venues (id, name, city, state, country, capacity, latitude, longitude, ticketmaster_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Madison Square Garden',
  'New York',
  'NY',
  'US',
  20000,
  40.7505,
  -73.9934,
  'KovZpZAJledA',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Madison Square Garden');

INSERT INTO venues (id, name, city, state, country, capacity, latitude, longitude, ticketmaster_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Staples Center',
  'Los Angeles',
  'CA',
  'US',
  20000,
  34.0430,
  -118.2673,
  'KovZpZAJ7eEA',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Staples Center');

INSERT INTO venues (id, name, city, state, country, capacity, latitude, longitude, ticketmaster_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'United Center',
  'Chicago',
  'IL',
  'US',
  23500,
  41.8807,
  -87.6742,
  'KovZpZA7AAEA',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'United Center');

-- Create sample upcoming shows
INSERT INTO shows (id, artist_id, venue_id, title, date, status, ticketmaster_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  a.id,
  v.id,
  a.name || ' - ' || v.city || ' Tour 2025',
  CURRENT_DATE + INTERVAL '7 days' + (row_number() OVER () * INTERVAL '7 days'),
  'upcoming',
  'TM' || LPAD((row_number() OVER ())::text, 6, '0'),
  NOW(),
  NOW()
FROM artists a
CROSS JOIN venues v
WHERE NOT EXISTS (
  SELECT 1 FROM shows s2 
  WHERE s2.artist_id = a.id AND s2.venue_id = v.id
)
LIMIT 10;

-- Create some songs for the artists
INSERT INTO songs (id, artist_id, title, album, popularity, spotify_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  a.id,
  'Hit Song ' || gs.n,
  'Greatest Hits',
  90 - (gs.n * 5),
  'spotify_' || a.slug || '_' || gs.n,
  NOW(),
  NOW()
FROM artists a
CROSS JOIN generate_series(1, 5) gs(n)
WHERE NOT EXISTS (
  SELECT 1 FROM songs s2 
  WHERE s2.artist_id = a.id AND s2.title = 'Hit Song ' || gs.n
);

-- Create setlists for the shows
INSERT INTO setlists (id, show_id, name, order_index, is_encore, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  'Main Set',
  0,
  false,
  NOW(),
  NOW()
FROM shows s
WHERE NOT EXISTS (
  SELECT 1 FROM setlists sl2 
  WHERE sl2.show_id = s.id
);

-- Add songs to setlists
INSERT INTO setlist_songs (id, setlist_id, song_id, position, vote_count, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  sl.id,
  so.id,
  row_number() OVER (PARTITION BY sl.id ORDER BY so.popularity DESC),
  (RANDOM() * 10)::INTEGER,
  NOW(),
  NOW()
FROM setlists sl
JOIN shows s ON s.id = sl.show_id
JOIN songs so ON so.artist_id = s.artist_id
WHERE NOT EXISTS (
  SELECT 1 FROM setlist_songs ss2 
  WHERE ss2.setlist_id = sl.id AND ss2.song_id = so.id
);