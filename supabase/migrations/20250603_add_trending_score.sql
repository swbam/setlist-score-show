-- Add trending_score column to shows table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shows' 
        AND column_name = 'trending_score'
    ) THEN
        ALTER TABLE shows ADD COLUMN trending_score INTEGER DEFAULT 0;
        CREATE INDEX idx_shows_trending_score ON shows(trending_score DESC);
    END IF;
END $$;