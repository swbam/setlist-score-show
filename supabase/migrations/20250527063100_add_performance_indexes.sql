-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
CREATE INDEX IF NOT EXISTS idx_shows_artist_date ON shows(artist_id, date);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_votes ON setlist_songs(votes DESC);
CREATE INDEX IF NOT EXISTS idx_votes_user_created ON votes(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_songs_artist_popularity ON songs(artist_id, popularity DESC);