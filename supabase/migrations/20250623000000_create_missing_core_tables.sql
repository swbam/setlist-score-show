-- =========================================================
--  Safety-Patch Migration
--  Date: 2025-06-23
--  Purpose: Create core tables that were missed or dropped
--           during previous failed migrations so that the
--           schema matches MasterFixPlan v2.0.
-- =========================================================

-- NOTE: All CREATE statements use IF NOT EXISTS so running
--       this script multiple times is harmless.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------
-- USERS (app-level wrapper)
-----------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  display_name  text,
  avatar_url    text,
  spotify_id    text UNIQUE,
  preferences   jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-----------------------------
-- ARTISTS
-----------------------------
CREATE TABLE IF NOT EXISTS public.artists (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_id       text UNIQUE,
  ticketmaster_id  text,
  setlistfm_mbid   text UNIQUE,
  name             text NOT NULL,
  slug             text UNIQUE NOT NULL,
  image_url        text,
  genres           text[],
  popularity       integer DEFAULT 0,
  followers        integer DEFAULT 0,
  last_synced_at   timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-----------------------------
-- VENUES
-----------------------------
CREATE TABLE IF NOT EXISTS public.venues (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticketmaster_id  text UNIQUE,
  setlistfm_id     text UNIQUE,
  name             text NOT NULL,
  address          text,
  city             text NOT NULL,
  state            text,
  country          text NOT NULL,
  postal_code      text,
  latitude         numeric,
  longitude        numeric,
  timezone         text,
  capacity         integer,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-----------------------------
-- SONGS
-----------------------------
CREATE TABLE IF NOT EXISTS public.songs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id       uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  spotify_id      text UNIQUE,
  musicbrainz_id  text UNIQUE,
  title           text NOT NULL,
  album           text,
  album_image_url text,
  duration_ms     integer,
  popularity      integer DEFAULT 0,
  preview_url     text,
  spotify_url     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT unique_artist_song UNIQUE (artist_id,title,album)
);

-----------------------------
-- VOTE ANALYTICS
-----------------------------
CREATE TABLE IF NOT EXISTS public.vote_analytics (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid REFERENCES public.users(id) ON DELETE CASCADE,
  show_id        uuid REFERENCES public.shows(id) ON DELETE CASCADE,
  daily_votes    integer DEFAULT 0,
  show_votes     integer DEFAULT 0,
  last_vote_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  CONSTRAINT unique_user_show_analytics UNIQUE (user_id,show_id)
);

-----------------------------
-- PLAYED SETLISTS
-----------------------------
CREATE TABLE IF NOT EXISTS public.played_setlists (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id       uuid REFERENCES public.shows(id) ON DELETE CASCADE,
  setlistfm_id  text,
  played_date   date,
  imported_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.played_setlist_songs (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  played_setlist_id  uuid REFERENCES public.played_setlists(id) ON DELETE CASCADE,
  song_id            uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  position           integer NOT NULL
);

-----------------------------
-- USER_ARTISTS
-----------------------------
CREATE TABLE IF NOT EXISTS public.user_artists (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
  artist_id  uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  source     text DEFAULT 'manual',
  followed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, artist_id)
);

-----------------------------
-- SEARCH ANALYTICS
-----------------------------
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  query         text NOT NULL,
  result_count  integer,
  created_at    timestamptz DEFAULT now()
);

-----------------------------
-- SYNC HISTORY
-----------------------------
CREATE TABLE IF NOT EXISTS public.sync_history (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type         text NOT NULL,
  entity_type       text NOT NULL,
  entity_id         uuid,
  external_id       text,
  status            text NOT NULL,
  error_message     text,
  items_processed   integer DEFAULT 0,
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz
);

-- Minimal indexes for performance
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm ON public.artists USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_songs_title_trgm  ON public.songs   USING gin (title gin_trgm_ops);

-- Grant public read access (views & anon users)
GRANT SELECT ON TABLE public.artists, public.venues, public.songs, public.shows TO anon, authenticated;

-- Finish
COMMENT ON MIGRATION IS 'Fills in missing core tables after failed destructive migration.'; 