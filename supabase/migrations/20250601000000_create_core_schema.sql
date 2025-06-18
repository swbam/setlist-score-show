CREATE TABLE "artists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "spotify_id" TEXT,
    "ticketmaster_id" TEXT,
    "setlistfm_mbid" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image_url" TEXT,
    "genres" TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "last_synced_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "artists_spotify_id_key" UNIQUE ("spotify_id"),
    CONSTRAINT "artists_setlistfm_mbid_key" UNIQUE ("setlistfm_mbid"),
    CONSTRAINT "artists_slug_key" UNIQUE ("slug"),
    CONSTRAINT "artists_spotifyId_ticketmasterId_key" UNIQUE ("spotify_id", "ticketmaster_id")
);

CREATE TABLE "venues" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticketmaster_id" TEXT,
    "setlistfm_id" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "postal_code" TEXT,
    "latitude" DECIMAL(10, 8),
    "longitude" DECIMAL(11, 8),
    "timezone" TEXT,
    "capacity" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "venues_ticketmaster_id_key" UNIQUE ("ticketmaster_id"),
    CONSTRAINT "venues_setlistfm_id_key" UNIQUE ("setlistfm_id")
);

CREATE TABLE "shows" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "artist_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "ticketmaster_id" TEXT,
    "setlistfm_id" TEXT,
    "date" DATE NOT NULL,
    "start_time" TIME,
    "doors_time" TIME,
    "title" TEXT,
    "tour_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "ticketmaster_url" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "shows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "shows_ticketmaster_id_key" UNIQUE ("ticketmaster_id"),
    CONSTRAINT "shows_setlistfm_id_key" UNIQUE ("setlistfm_id"),
    CONSTRAINT "shows_artist_id_venue_id_date_key" UNIQUE ("artist_id", "venue_id", "date"),
    CONSTRAINT "shows_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE,
    CONSTRAINT "shows_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE
);

CREATE INDEX "shows_date_status_idx" ON "shows"("date", "status");
CREATE INDEX "shows_artist_id_date_idx" ON "shows"("artist_id", "date" DESC);

CREATE TABLE "songs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "artist_id" UUID NOT NULL,
    "spotify_id" TEXT,
    "musicbrainz_id" TEXT,
    "title" TEXT NOT NULL,
    "album" TEXT,
    "album_image_url" TEXT,
    "duration_ms" INTEGER,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "preview_url" TEXT,
    "spotify_url" TEXT,
    "audio_features" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "songs_spotify_id_key" UNIQUE ("spotify_id"),
    CONSTRAINT "songs_musicbrainz_id_key" UNIQUE ("musicbrainz_id"),
    CONSTRAINT "songs_artist_id_title_album_key" UNIQUE ("artist_id", "title", "album"),
    CONSTRAINT "songs_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE
);

CREATE INDEX "songs_artist_id_title_idx" ON "songs"("artist_id", "title");

CREATE TABLE "setlists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "show_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main Set',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_encore" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "setlists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "setlists_show_id_order_index_key" UNIQUE ("show_id", "order_index"),
    CONSTRAINT "setlists_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE CASCADE
);

CREATE TABLE "setlist_songs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "setlist_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "setlist_songs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "setlist_songs_setlist_id_position_key" UNIQUE ("setlist_id", "position"),
    CONSTRAINT "setlist_songs_setlist_id_song_id_key" UNIQUE ("setlist_id", "song_id"),
    CONSTRAINT "setlist_songs_setlist_id_fkey" FOREIGN KEY ("setlist_id") REFERENCES "setlists"("id") ON DELETE CASCADE,
    CONSTRAINT "setlist_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE
);

CREATE INDEX "setlist_songs_vote_count_idx" ON "setlist_songs"("vote_count" DESC);

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "spotify_id" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_spotify_id_key" UNIQUE ("spotify_id")
);

CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "setlist_song_id" UUID NOT NULL,
    "show_id" UUID NOT NULL,
    "vote_type" TEXT NOT NULL DEFAULT 'up',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "unique_user_song_vote" UNIQUE ("user_id", "setlist_song_id"),
    CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "votes_setlist_song_id_fkey" FOREIGN KEY ("setlist_song_id") REFERENCES "setlist_songs"("id") ON DELETE CASCADE,
    CONSTRAINT "votes_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE CASCADE
);

CREATE INDEX "votes_user_id_created_at_idx" ON "votes"("user_id", "created_at" DESC);
CREATE INDEX "votes_show_id_idx" ON "votes"("show_id");
CREATE INDEX "votes_user_id_show_id_idx" ON "votes"("user_id", "show_id");

CREATE TABLE "vote_analytics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "show_id" UUID NOT NULL,
    "daily_votes" INTEGER NOT NULL DEFAULT 0,
    "show_votes" INTEGER NOT NULL DEFAULT 0,
    "last_vote_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "vote_analytics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "unique_user_show_analytics" UNIQUE ("user_id", "show_id"),
    CONSTRAINT "vote_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "vote_analytics_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE CASCADE
);

CREATE TABLE "sync_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "sync_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "external_id" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "items_processed" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "played_setlists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "show_id" UUID NOT NULL,
    "setlistfm_id" TEXT,
    "played_date" DATE NOT NULL,
    "imported_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "played_setlists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "played_setlists_setlistfm_id_key" UNIQUE ("setlistfm_id"),
    CONSTRAINT "played_setlists_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "shows"("id") ON DELETE CASCADE
);

CREATE TABLE "played_setlist_songs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "played_setlist_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "played_setlist_songs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "played_setlist_songs_played_setlist_id_position_key" UNIQUE ("played_setlist_id", "position"),
    CONSTRAINT "played_setlist_songs_played_setlist_id_song_id_key" UNIQUE ("played_setlist_id", "song_id"),
    CONSTRAINT "played_setlist_songs_played_setlist_id_fkey" FOREIGN KEY ("played_setlist_id") REFERENCES "played_setlists"("id") ON DELETE CASCADE,
    CONSTRAINT "played_setlist_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE
);

CREATE TABLE "user_artists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "artist_id" UUID NOT NULL,
    "rank" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "user_artists_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_artists_user_id_artist_id_key" UNIQUE ("user_id", "artist_id"),
    CONSTRAINT "user_artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "user_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE
);
