-- Insert test data with valid UUIDs
-- Insert test artists
INSERT INTO artists (id, name, slug, spotify_id, genres, popularity, followers)
VALUES 
  ('a1111111-1111-1111-1111-111111111111'::uuid, 'The Beatles', 'the-beatles', '3WrFJ7ztbogyGnTHbHJFl2', ARRAY['rock', 'pop'], 90, 25000000),
  ('a2222222-2222-2222-2222-222222222222'::uuid, 'Pink Floyd', 'pink-floyd', '0k17h0D3J5VfsdmQ1iZtE9', ARRAY['rock', 'progressive rock'], 85, 15000000)
ON CONFLICT (id) DO NOTHING;

-- Insert test venues
INSERT INTO venues (id, name, city, state, country, capacity)
VALUES 
  ('b1111111-1111-1111-1111-111111111111'::uuid, 'Madison Square Garden', 'New York', 'NY', 'USA', 20000),
  ('b2222222-2222-2222-2222-222222222222'::uuid, 'The Hollywood Bowl', 'Los Angeles', 'CA', 'USA', 17500)
ON CONFLICT (id) DO NOTHING;

-- Insert test shows
INSERT INTO shows (id, artist_id, venue_id, date, title, status)
VALUES 
  ('c1111111-1111-1111-1111-111111111111'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, 'b1111111-1111-1111-1111-111111111111'::uuid, CURRENT_DATE + INTERVAL '30 days', 'The Beatles Revival Tour', 'upcoming'),
  ('c2222222-2222-2222-2222-222222222222'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'b2222222-2222-2222-2222-222222222222'::uuid, CURRENT_DATE + INTERVAL '45 days', 'Pink Floyd Experience', 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- Insert test songs
INSERT INTO songs (id, artist_id, title, album, spotify_id, duration_ms, popularity)
VALUES 
  ('d1111111-1111-1111-1111-111111111111'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, 'Hey Jude', 'The Beatles (White Album)', '0aym2LBJBk9DAYuHHutrIl', 431333, 85),
  ('d2222222-2222-2222-2222-222222222222'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, 'Let It Be', 'Let It Be', '7iN1s7xHE4ifF5povM6A48', 243026, 82),
  ('d3333333-3333-3333-3333-333333333333'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'Comfortably Numb', 'The Wall', '5HNCy40Ni5BZJFw1TKzRsC', 382296, 88),
  ('d4444444-4444-4444-4444-444444444444'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, 'Wish You Were Here', 'Wish You Were Here', '6mFkJmJqdDVQ1REhVfGgd1', 334743, 86)
ON CONFLICT (id) DO NOTHING;

-- Insert test setlists
INSERT INTO setlists (id, show_id, name, order_index)
VALUES 
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'c1111111-1111-1111-1111-111111111111'::uuid, 'Main Set', 0),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'c2222222-2222-2222-2222-222222222222'::uuid, 'Main Set', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert test setlist songs
INSERT INTO setlist_songs (setlist_id, song_id, position, vote_count)
VALUES 
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'd1111111-1111-1111-1111-111111111111'::uuid, 1, 0),
  ('e1111111-1111-1111-1111-111111111111'::uuid, 'd2222222-2222-2222-2222-222222222222'::uuid, 2, 0),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'd3333333-3333-3333-3333-333333333333'::uuid, 1, 0),
  ('e2222222-2222-2222-2222-222222222222'::uuid, 'd4444444-4444-4444-4444-444444444444'::uuid, 2, 0)
ON CONFLICT (setlist_id, position) DO NOTHING;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW trending_shows;

SELECT 'Test data inserted successfully!' as status;