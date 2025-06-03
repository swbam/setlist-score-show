-- Add remaining tables and constraints

-- Create vote_analytics table
CREATE TABLE "VoteAnalytics" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "showId" TEXT NOT NULL,
  "dailyVotes" INTEGER NOT NULL DEFAULT 0,
  "showVotes" INTEGER NOT NULL DEFAULT 0,
  "lastVoteAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "VoteAnalytics_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "VoteAnalytics_userId_showId_key" ON "VoteAnalytics"("userId", "showId");
CREATE INDEX "VoteAnalytics_userId_lastVoteAt_idx" ON "VoteAnalytics"("userId", "lastVoteAt");

-- Add foreign keys
ALTER TABLE "VoteAnalytics" ADD CONSTRAINT "VoteAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoteAnalytics" ADD CONSTRAINT "VoteAnalytics_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create functions for vote validation
CREATE OR REPLACE FUNCTION check_daily_vote_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM "Vote"
    WHERE "userId" = NEW."userId"
      AND "createdAt" >= CURRENT_DATE
  ) >= 50 THEN
    RAISE EXCEPTION 'Daily vote limit exceeded (50 votes)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_daily_vote_limit
BEFORE INSERT ON "Vote"
FOR EACH ROW
EXECUTE FUNCTION check_daily_vote_limit();

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "SetlistSong"
    SET "voteCount" = "voteCount" + 1
    WHERE "id" = NEW."setlistSongId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "SetlistSong"
    SET "voteCount" = "voteCount" - 1
    WHERE "id" = OLD."setlistSongId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_setlist_song_vote_count
AFTER INSERT OR DELETE ON "Vote"
FOR EACH ROW
EXECUTE FUNCTION update_vote_count();

-- Create function to generate slug
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate artist slug
CREATE OR REPLACE FUNCTION set_artist_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."slug" IS NULL THEN
    NEW."slug" = generate_slug(NEW."name");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_artist_slug
BEFORE INSERT OR UPDATE ON "Artist"
FOR EACH ROW
EXECUTE FUNCTION set_artist_slug();

-- Create view for show statistics
CREATE VIEW show_statistics AS
SELECT 
  s.id as show_id,
  s."artistId",
  s."venueId",
  s.date,
  s.title,
  COUNT(DISTINCT v."userId") as unique_voters,
  COUNT(v.id) as total_votes,
  AVG(ss."voteCount") as avg_votes_per_song,
  MAX(ss."voteCount") as max_song_votes
FROM "Show" s
LEFT JOIN "Setlist" sl ON sl."showId" = s.id
LEFT JOIN "SetlistSong" ss ON ss."setlistId" = sl.id
LEFT JOIN "Vote" v ON v."setlistSongId" = ss.id
GROUP BY s.id, s."artistId", s."venueId", s.date, s.title;

-- Create index for common queries
CREATE INDEX idx_show_statistics_artist ON "Show"("artistId", date DESC);
CREATE INDEX idx_show_statistics_date ON "Show"(date) WHERE status = 'scheduled';

-- Grant permissions for Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;