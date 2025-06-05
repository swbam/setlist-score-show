-- Insert sample data for testing
-- This script should be run after the initial schema setup

-- Sample Artists
INSERT INTO artists (id, name, slug, image_url, genres, popularity, followers) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Arctic Monkeys', 'arctic-monkeys', 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', ARRAY['indie rock', 'alternative rock'], 85, 12500000),
('550e8400-e29b-41d4-a716-446655440002', 'The Strokes', 'the-strokes', 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', ARRAY['indie rock', 'garage rock'], 75, 8200000),
('550e8400-e29b-41d4-a716-446655440003', 'Radiohead', 'radiohead', 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', ARRAY['alternative rock', 'art rock'], 90, 15000000),
('550e8400-e29b-41d4-a716-446655440004', 'Tame Impala', 'tame-impala', 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', ARRAY['psychedelic pop', 'neo-psychedelia'], 80, 7800000),
('550e8400-e29b-41d4-a716-446655440005', 'Kings of Leon', 'kings-of-leon', 'https://i.scdn.co/image/ab6761610000e5eb7da39dea0a72f581535fb11f', ARRAY['alternative rock', 'southern rock'], 70, 6500000)
ON CONFLICT (id) DO NOTHING;

-- Sample Venues
INSERT INTO venues (id, name, city, state, country, capacity) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Madison Square Garden', 'New York', 'NY', 'USA', 20000),
('660e8400-e29b-41d4-a716-446655440002', 'Red Rocks Amphitheatre', 'Morrison', 'CO', 'USA', 9525),
('660e8400-e29b-41d4-a716-446655440003', 'The Hollywood Bowl', 'Los Angeles', 'CA', 'USA', 17500),
('660e8400-e29b-41d4-a716-446655440004', 'The O2 Arena', 'London', '', 'UK', 20000),
('660e8400-e29b-41d4-a716-446655440005', 'Coachella Valley Music Festival', 'Indio', 'CA', 'USA', 125000)
ON CONFLICT (id) DO NOTHING;

-- Sample Shows (upcoming)
INSERT INTO shows (id, artist_id, venue_id, date, title, status, view_count) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2025-06-15', 'Arctic Monkeys Live at MSG', 'upcoming', 1250),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '2025-06-20', 'The Strokes at Red Rocks', 'upcoming', 980),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '2025-07-10', 'Radiohead at Hollywood Bowl', 'upcoming', 2100),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '2025-07-25', 'Tame Impala London Show', 'upcoming', 850),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', '2025-08-15', 'Kings of Leon at Coachella', 'upcoming', 3200)
ON CONFLICT (id) DO NOTHING;

-- Sample Songs for Arctic Monkeys
INSERT INTO songs (id, artist_id, title, album, duration_ms, popularity) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Do I Wanna Know?', 'AM', 263000, 95),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'R U Mine?', 'AM', 201000, 90),
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Why''d You Only Call Me When You''re High?', 'AM', 166000, 85),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Arabella', 'AM', 207000, 80),
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'I Bet You Look Good on the Dancefloor', 'Whatever People Say I Am, That''s What I''m Not', 174000, 88),
('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Fluorescent Adolescent', 'Favourite Worst Nightmare', 178000, 82),
('880e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'When the Sun Goes Down', 'Whatever People Say I Am, That''s What I''m Not', 199000, 75),
('880e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', '505', 'Favourite Worst Nightmare', 254000, 78)
ON CONFLICT (id) DO NOTHING;

-- Sample Songs for The Strokes
INSERT INTO songs (id, artist_id, title, album, duration_ms, popularity) VALUES
('880e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', 'Last Nite', 'Is This It', 195000, 92),
('880e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'Someday', 'Is This It', 186000, 88),
('880e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440002', 'The Modern Age', 'Is This It', 219000, 85),
('880e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440002', 'Hard to Explain', 'Is This It', 230000, 80),
('880e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440002', 'Reptilia', 'Room on Fire', 221000, 87),
('880e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440002', '12:51', 'Room on Fire', 147000, 83)
ON CONFLICT (id) DO NOTHING;

-- Sample Songs for Radiohead
INSERT INTO songs (id, artist_id, title, album, duration_ms, popularity) VALUES
('880e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440003', 'Creep', 'Pablo Honey', 238000, 95),
('880e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440003', 'Karma Police', 'OK Computer', 264000, 90),
('880e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440003', 'Paranoid Android', 'OK Computer', 386000, 88),
('880e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440003', 'No Surprises', 'OK Computer', 228000, 85),
('880e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440003', 'Fake Plastic Trees', 'The Bends', 291000, 82),
('880e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440003', 'High and Dry', 'The Bends', 274000, 78)
ON CONFLICT (id) DO NOTHING;

-- Sample Setlists
INSERT INTO setlists (id, show_id, name, order_index) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Main Set', 0),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Main Set', 0),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Main Set', 0)
ON CONFLICT (id) DO NOTHING;

-- Sample Setlist Songs for Arctic Monkeys show
INSERT INTO setlist_songs (id, setlist_id, song_id, position, vote_count) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 1, 45),
('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', 2, 38),
('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', 3, 32),
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440004', 4, 28),
('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', 5, 52),
('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440006', 6, 25),
('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440007', 7, 18),
('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440008', 8, 21)
ON CONFLICT (id) DO NOTHING;

-- Sample Setlist Songs for The Strokes show
INSERT INTO setlist_songs (id, setlist_id, song_id, position, vote_count) VALUES
('aa0e8400-e29b-41d4-a716-446655440101', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440101', 1, 42),
('aa0e8400-e29b-41d4-a716-446655440102', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440102', 2, 35),
('aa0e8400-e29b-41d4-a716-446655440103', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440103', 3, 29),
('aa0e8400-e29b-41d4-a716-446655440104', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440104', 4, 24),
('aa0e8400-e29b-41d4-a716-446655440105', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440105', 5, 38),
('aa0e8400-e29b-41d4-a716-446655440106', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440106', 6, 22)
ON CONFLICT (id) DO NOTHING;

-- Sample Setlist Songs for Radiohead show
INSERT INTO setlist_songs (id, setlist_id, song_id, position, vote_count) VALUES
('aa0e8400-e29b-41d4-a716-446655440201', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440201', 1, 65),
('aa0e8400-e29b-41d4-a716-446655440202', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440202', 2, 58),
('aa0e8400-e29b-41d4-a716-446655440203', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440203', 3, 48),
('aa0e8400-e29b-41d4-a716-446655440204', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440204', 4, 41),
('aa0e8400-e29b-41d4-a716-446655440205', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440205', 5, 36),
('aa0e8400-e29b-41d4-a716-446655440206', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440206', 6, 31)
ON CONFLICT (id) DO NOTHING;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW trending_shows;