-- Drop the old view if it exists
DROP VIEW IF EXISTS trending_shows;

-- Create/replace the view with the correct name that the app expects
CREATE OR REPLACE VIEW trending_shows AS
SELECT * FROM trending_shows_view;