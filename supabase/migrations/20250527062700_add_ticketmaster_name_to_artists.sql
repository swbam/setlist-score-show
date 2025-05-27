ALTER TABLE artists
ADD COLUMN ticketmaster_name TEXT;

COMMENT ON COLUMN artists.ticketmaster_name IS 'The name of the artist as it appears on Ticketmaster, used for mapping purposes.';