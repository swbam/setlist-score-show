# MASTER FIXES — PART 2: DATA LAYER & MIGRATIONS
**Database Schema, RPCs, and Migration Strategy**

> **Document Series:** Part 2 of 5  
> **Dependencies:** Part 1 (Overview)  
> **Implementation Time:** 2 days  
> **Database:** Supabase PostgreSQL 15 + PostGIS

---

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Extensions & Prerequisites](#extensions--prerequisites)
3. [Table Schemas](#table-schemas)
4. [Migration Scripts](#migration-scripts)
5. [RPC Functions](#rpc-functions)
6. [Row-Level Security](#row-level-security)
7. [Indexes & Performance](#indexes--performance)
8. [Data Validation Rules](#data-validation-rules)
9. [Backup & Recovery](#backup--recovery)

---

## 1. Database Overview

### 1.1 Current State Analysis
**Supabase Project:** `ailrmwtahifvstpfhbgn`  
**Region:** us-east-2  
**Plan:** Pro ($25/month)  
**PostgreSQL Version:** 15.6  

### 1.2 Schema Drift Issues
The local development environment has 25+ migration files, but production database is missing several critical tables and functions:

**Missing in Production:**
- `homepage_cache` table
- `zip_codes` table  
- `refresh_homepage_cache()` function
- `get_nearby_shows()` function
- PostGIS spatial indexes
- Several performance indexes

### 1.3 Data Volume Estimates
| Table | Current Rows | Expected Growth | Storage Impact |
|-------|--------------|-----------------|----------------|
| artists | ~2,500 | +500/month | 15 MB |
| venues | ~1,200 | +200/month | 8 MB |
| shows | ~8,000 | +2000/month | 45 MB |
| setlists | ~3,500 | +1000/month | 12 MB |
| setlist_songs | ~35,000 | +10000/month | 85 MB |
| votes | ~12,000 | +5000/month | 25 MB |
| homepage_cache | 0 → 2 | Static | < 1 MB |
| zip_codes | 0 → 41,000 | Static | 15 MB |

---

## 2. Extensions & Prerequisites

### 2.1 Required Extensions
```sql
-- Core UUID and text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Spatial queries for location search  
CREATE EXTENSION IF NOT EXISTS postgis;

-- Cron jobs for automated tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- JSON operations (usually included)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Extension Verification
```sql
-- Verify all extensions are installed
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_trgm', 'postgis', 'pg_cron', 'pgcrypto');
```

---

## 3. Table Schemas

### 3.1 Core Entity Tables

#### **artists** (existing - needs updates)
```sql
-- Add missing constraints and indexes
ALTER TABLE artists 
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT artists_slug_unique UNIQUE(slug),
  ADD CONSTRAINT artists_name_not_empty CHECK (length(trim(name)) > 0),
  ADD CONSTRAINT artists_popularity_range CHECK (popularity >= 0 AND popularity <= 100);

-- Update existing NULL slugs
UPDATE artists 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Add trigram index for fast text search
CREATE INDEX IF NOT EXISTS idx_artists_name_trgm 
  ON artists USING gin(name gin_trgm_ops);

-- Add popularity index for homepage queries
CREATE INDEX IF NOT EXISTS idx_artists_popularity 
  ON artists(popularity DESC) WHERE popularity > 0;
```

#### **venues** (existing - needs location column)
```sql
-- Add PostGIS geography column for spatial queries
ALTER TABLE venues 
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Populate location from existing lat/lng data
UPDATE venues 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL 
  AND longitude IS NOT NULL 
  AND latitude IS NOT NULL
  AND longitude BETWEEN -180 AND 180
  AND latitude BETWEEN -90 AND 90;

-- Add spatial index
CREATE INDEX IF NOT EXISTS idx_venues_location 
  ON venues USING GIST(location);

-- Add constraint for valid coordinates
ALTER TABLE venues 
  ADD CONSTRAINT venues_valid_coordinates 
  CHECK (
    (longitude IS NULL AND latitude IS NULL) OR
    (longitude BETWEEN -180 AND 180 AND latitude BETWEEN -90 AND 90)
  );
```

#### **shows** (existing - needs performance indexes)
```sql
-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_shows_status_date 
  ON shows(status, date) WHERE status = 'upcoming';

-- Add index for popularity-based queries
CREATE INDEX IF NOT EXISTS idx_shows_popularity 
  ON shows(popularity DESC) WHERE status = 'upcoming';

-- Add constraint for valid dates
ALTER TABLE shows 
  ADD CONSTRAINT shows_future_date 
  CHECK (date >= '2020-01-01'::date);

-- Add constraint for valid status
ALTER TABLE shows 
  ADD CONSTRAINT shows_valid_status 
  CHECK (status IN ('upcoming', 'completed', 'cancelled'));
```

### 3.2 New Cache Tables

#### **homepage_cache** (new)
```sql
CREATE TABLE IF NOT EXISTS homepage_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT homepage_cache_valid_key 
    CHECK (cache_key IN ('top_artists', 'top_shows', 'trending_venues')),
  CONSTRAINT homepage_cache_future_expiry 
    CHECK (expires_at > created_at)
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_homepage_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_cache_update_timestamp
  BEFORE UPDATE ON homepage_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_cache_timestamp();

-- Add index for cache key lookups
CREATE INDEX IF NOT EXISTS idx_homepage_cache_key_expiry 
  ON homepage_cache(cache_key, expires_at);
```

#### **zip_codes** (new)
```sql
CREATE TABLE IF NOT EXISTS zip_codes (
  zip_code char(5) PRIMARY KEY,
  city text NOT NULL,
  state char(2) NOT NULL,
  county text,
  latitude decimal(10,7) NOT NULL,
  longitude decimal(10,7) NOT NULL,
  timezone text,
  population integer,
  
  -- Constraints
  CONSTRAINT zip_codes_valid_coords 
    CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180),
  CONSTRAINT zip_codes_valid_state 
    CHECK (length(state) = 2),
  CONSTRAINT zip_codes_valid_zip 
    CHECK (zip_code ~ '^\d{5}$')
);

-- Add spatial index for radius queries
CREATE INDEX IF NOT EXISTS idx_zip_codes_location 
  ON zip_codes USING GIST(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Add text search index for city names
CREATE INDEX IF NOT EXISTS idx_zip_codes_city_trgm 
  ON zip_codes USING gin(city gin_trgm_ops);
```

### 3.3 Operational Tables

#### **sync_state** (existing - verify structure)
```sql
-- Ensure sync_state table exists with proper structure
CREATE TABLE IF NOT EXISTS sync_state (
  job_name text PRIMARY KEY,
  last_sync_date timestamptz,
  last_success_date timestamptz,
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT sync_state_valid_counts 
    CHECK (records_processed >= 0 AND records_created >= 0 AND records_updated >= 0),
  CONSTRAINT sync_state_valid_execution_time 
    CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0)
);

-- Add index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_sync_state_last_sync 
  ON sync_state(last_sync_date DESC);
```

---

## 4. Migration Scripts

### 4.1 Migration File Structure
```
supabase/migrations/
├── 20250621000001_extensions_and_constraints.sql
├── 20250621000002_homepage_cache_table.sql  
├── 20250621000003_zip_codes_table.sql
├── 20250621000004_spatial_indexes.sql
├── 20250621000005_rpc_functions.sql
├── 20250621000006_row_level_security.sql
└── 20250621000007_data_backfill.sql
```

### 4.2 Migration 1: Extensions and Constraints
```sql
-- File: 20250621000001_extensions_and_constraints.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add missing constraints to existing tables
ALTER TABLE artists 
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT IF NOT EXISTS artists_slug_unique UNIQUE(slug),
  ADD CONSTRAINT IF NOT EXISTS artists_name_not_empty CHECK (length(trim(name)) > 0),
  ADD CONSTRAINT IF NOT EXISTS artists_popularity_range CHECK (popularity >= 0 AND popularity <= 100);

-- Fix NULL slugs
UPDATE artists 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Add venue location column
ALTER TABLE venues 
  ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Add shows constraints
ALTER TABLE shows 
  ADD CONSTRAINT IF NOT EXISTS shows_future_date CHECK (date >= '2020-01-01'::date),
  ADD CONSTRAINT IF NOT EXISTS shows_valid_status CHECK (status IN ('upcoming', 'completed', 'cancelled'));

-- Add vote constraints
ALTER TABLE votes
  ADD CONSTRAINT IF NOT EXISTS votes_positive_count CHECK (vote_count >= 0);
```

### 4.3 Migration 2: Homepage Cache
```sql
-- File: 20250621000002_homepage_cache_table.sql

CREATE TABLE IF NOT EXISTS homepage_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT homepage_cache_valid_key 
    CHECK (cache_key IN ('top_artists', 'top_shows', 'trending_venues')),
  CONSTRAINT homepage_cache_future_expiry 
    CHECK (expires_at > created_at)
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_homepage_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_cache_update_timestamp
  BEFORE UPDATE ON homepage_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_cache_timestamp();

-- Performance index
CREATE INDEX IF NOT EXISTS idx_homepage_cache_key_expiry 
  ON homepage_cache(cache_key, expires_at);
```

### 4.4 Migration 3: ZIP Codes Table
```sql
-- File: 20250621000003_zip_codes_table.sql

CREATE TABLE IF NOT EXISTS zip_codes (
  zip_code char(5) PRIMARY KEY,
  city text NOT NULL,
  state char(2) NOT NULL,
  county text,
  latitude decimal(10,7) NOT NULL,
  longitude decimal(10,7) NOT NULL,
  timezone text,
  population integer,
  
  CONSTRAINT zip_codes_valid_coords 
    CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180),
  CONSTRAINT zip_codes_valid_state 
    CHECK (length(state) = 2),
  CONSTRAINT zip_codes_valid_zip 
    CHECK (zip_code ~ '^\d{5}$')
);

-- Spatial index for radius queries
CREATE INDEX IF NOT EXISTS idx_zip_codes_location 
  ON zip_codes USING GIST(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Text search for city names
CREATE INDEX IF NOT EXISTS idx_zip_codes_city_trgm 
  ON zip_codes USING gin(city gin_trgm_ops);

-- State lookup index
CREATE INDEX IF NOT EXISTS idx_zip_codes_state 
  ON zip_codes(state);
```

---

## 5. RPC Functions

### 5.1 Homepage Cache Functions

#### **refresh_homepage_cache()** - Core cache refresh
```sql
CREATE OR REPLACE FUNCTION refresh_homepage_cache() 
RETURNS jsonb AS $$
DECLARE
  artists_data jsonb;
  shows_data jsonb;
  result jsonb;
BEGIN
  -- Generate top artists data
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'name', a.name,
      'slug', a.slug,
      'image_url', a.image_url,
      'genres', a.genres,
      'popularity', a.popularity,
      'followers', a.followers,
      'upcoming_shows_count', COALESCE(show_counts.count, 0),
      'total_votes', COALESCE(vote_counts.total, 0),
      'next_show_date', show_counts.next_date
    )
  ) INTO artists_data
  FROM artists a
  LEFT JOIN (
    SELECT 
      s.artist_id,
      COUNT(*) as count,
      MIN(s.date) as next_date
    FROM shows s 
    WHERE s.status = 'upcoming' 
      AND s.date >= CURRENT_DATE
      AND s.date <= CURRENT_DATE + INTERVAL '90 days'
    GROUP BY s.artist_id
  ) show_counts ON show_counts.artist_id = a.id
  LEFT JOIN (
    SELECT 
      s.artist_id,
      SUM(ss.vote_count) as total
    FROM shows s
    JOIN setlists sl ON sl.show_id = s.id
    JOIN setlist_songs ss ON ss.setlist_id = sl.id
    WHERE s.status = 'upcoming'
    GROUP BY s.artist_id
  ) vote_counts ON vote_counts.artist_id = a.id
  WHERE a.image_url IS NOT NULL
    AND (show_counts.count > 0 OR a.popularity > 50)
  ORDER BY 
    a.popularity DESC,
    COALESCE(show_counts.count, 0) DESC,
    COALESCE(vote_counts.total, 0) DESC
  LIMIT 24;

  -- Generate top shows data
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'date', s.date,
      'status', s.status,
      'popularity', s.popularity,
      'tickets_url', s.tickets_url,
      'min_price', s.min_price,
      'max_price', s.max_price,
      'artist', jsonb_build_object(
        'id', a.id,
        'name', a.name,
        'slug', a.slug,
        'image_url', a.image_url,
        'genres', a.genres
      ),
      'venue', jsonb_build_object(
        'id', v.id,
        'name', v.name,
        'city', v.city,
        'state', v.state,
        'capacity', v.capacity
      ),
      'total_votes', COALESCE(vote_totals.total, 0),
      'songs_count', COALESCE(vote_totals.songs, 0)
    )
  ) INTO shows_data
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN (
    SELECT 
      sl.show_id,
      SUM(ss.vote_count) as total,
      COUNT(DISTINCT ss.song_id) as songs
    FROM setlists sl
    JOIN setlist_songs ss ON ss.setlist_id = sl.id
    WHERE sl.is_actual = false
    GROUP BY sl.show_id
  ) vote_totals ON vote_totals.show_id = s.id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND s.date <= CURRENT_DATE + INTERVAL '30 days'
    AND a.image_url IS NOT NULL
  ORDER BY 
    s.popularity DESC,
    COALESCE(vote_totals.total, 0) DESC,
    s.date ASC
  LIMIT 20;

  -- Insert/update cache entries
  INSERT INTO homepage_cache (cache_key, data, expires_at)
  VALUES 
    ('top_artists', artists_data, NOW() + INTERVAL '10 minutes'),
    ('top_shows', shows_data, NOW() + INTERVAL '10 minutes')
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

  -- Return summary
  result := jsonb_build_object(
    'success', true,
    'artists_count', jsonb_array_length(COALESCE(artists_data, '[]'::jsonb)),
    'shows_count', jsonb_array_length(COALESCE(shows_data, '[]'::jsonb)),
    'cached_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Location Search Functions

#### **get_nearby_shows()** - ZIP code radius search
```sql
CREATE OR REPLACE FUNCTION get_nearby_shows(
  p_zip_code text,
  p_radius_km integer DEFAULT 160,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  show_id uuid,
  show_name text,
  show_date timestamptz,
  show_status text,
  artist_id uuid,
  artist_name text,
  artist_slug text,
  artist_image text,
  venue_id uuid,
  venue_name text,
  venue_city text,
  venue_state text,
  venue_capacity integer,
  distance_km float,
  total_votes bigint
) AS $$
DECLARE
  v_lat decimal;
  v_lng decimal;
  v_point geography;
BEGIN
  -- Get coordinates for ZIP code
  SELECT latitude, longitude 
  INTO v_lat, v_lng
  FROM zip_codes 
  WHERE zip_code = p_zip_code;
  
  -- Validate ZIP code exists
  IF v_lat IS NULL THEN
    RAISE EXCEPTION 'Invalid ZIP code: %', p_zip_code;
  END IF;
  
  -- Create point for distance calculations
  v_point := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    s.id as show_id,
    s.name as show_name,
    s.date as show_date,
    s.status as show_status,
    a.id as artist_id,
    a.name as artist_name,
    a.slug as artist_slug,
    a.image_url as artist_image,
    v.id as venue_id,
    v.name as venue_name,
    v.city as venue_city,
    v.state as venue_state,
    v.capacity as venue_capacity,
    (ST_Distance(v.location, v_point) / 1000)::float as distance_km,
    COALESCE(vote_totals.total, 0) as total_votes
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN (
    SELECT 
      sl.show_id,
      SUM(ss.vote_count) as total
    FROM setlists sl
    JOIN setlist_songs ss ON ss.setlist_id = sl.id
    WHERE sl.is_actual = false
    GROUP BY sl.show_id
  ) vote_totals ON vote_totals.show_id = s.id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND v.location IS NOT NULL
    AND ST_DWithin(v.location, v_point, p_radius_km * 1000)
  ORDER BY 
    distance_km ASC,
    s.date ASC,
    COALESCE(vote_totals.total, 0) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Search Functions

#### **search_unified()** - Fallback search for internal data
```sql
CREATE OR REPLACE FUNCTION search_unified(
  p_query text,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  result_type text,
  id uuid,
  name text,
  slug text,
  image_url text,
  metadata jsonb
) AS $$
BEGIN
  -- Validate input
  IF length(trim(p_query)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  -- Search artists
  SELECT 
    'artist'::text as result_type,
    a.id,
    a.name,
    a.slug,
    a.image_url,
    jsonb_build_object(
      'genres', a.genres,
      'popularity', a.popularity,
      'upcoming_shows', COALESCE(show_counts.count, 0)
    ) as metadata
  FROM artists a
  LEFT JOIN (
    SELECT artist_id, COUNT(*) as count
    FROM shows 
    WHERE status = 'upcoming' AND date >= CURRENT_DATE
    GROUP BY artist_id
  ) show_counts ON show_counts.artist_id = a.id
  WHERE a.name ILIKE '%' || p_query || '%'
    OR a.name % p_query  -- trigram similarity
  ORDER BY 
    similarity(a.name, p_query) DESC,
    a.popularity DESC
  LIMIT p_limit / 2

  UNION ALL

  -- Search shows
  SELECT 
    'show'::text as result_type,
    s.id,
    s.name,
    NULL::text as slug,
    a.image_url,
    jsonb_build_object(
      'date', s.date,
      'artist_name', a.name,
      'venue_name', v.name,
      'venue_city', v.city
    ) as metadata
  FROM shows s
  JOIN artists a ON a.id = s.artist_id
  JOIN venues v ON v.id = s.venue_id
  WHERE s.status = 'upcoming'
    AND s.date >= CURRENT_DATE
    AND (
      s.name ILIKE '%' || p_query || '%'
      OR a.name ILIKE '%' || p_query || '%'
      OR v.name ILIKE '%' || p_query || '%'
    )
  ORDER BY s.date ASC
  LIMIT p_limit / 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Utility Functions

#### **create_initial_setlist()** - Generate default setlist for new shows
```sql
CREATE OR REPLACE FUNCTION create_initial_setlist(
  p_show_id uuid,
  p_artist_id uuid
)
RETURNS uuid AS $$
DECLARE
  v_setlist_id uuid;
  v_song_record record;
  v_songs_added integer := 0;
BEGIN
  -- Check if setlist already exists
  SELECT id INTO v_setlist_id
  FROM setlists 
  WHERE show_id = p_show_id AND is_actual = false;
  
  IF v_setlist_id IS NOT NULL THEN
    RETURN v_setlist_id;
  END IF;
  
  -- Create new setlist
  INSERT INTO setlists (show_id, is_actual, created_at)
  VALUES (p_show_id, false, NOW())
  RETURNING id INTO v_setlist_id;
  
  -- Add top 5 songs for the artist (by popularity or random if no popularity data)
  FOR v_song_record IN
    SELECT id, name
    FROM songs 
    WHERE artist_id = p_artist_id
    ORDER BY 
      CASE WHEN popularity IS NOT NULL THEN popularity ELSE 0 END DESC,
      RANDOM()
    LIMIT 5
  LOOP
    INSERT INTO setlist_songs (setlist_id, song_id, vote_count, position)
    VALUES (v_setlist_id, v_song_record.id, 0, v_songs_added + 1);
    
    v_songs_added := v_songs_added + 1;
  END LOOP;
  
  -- If no songs found, log it but don't fail
  IF v_songs_added = 0 THEN
    RAISE NOTICE 'No songs found for artist_id: %', p_artist_id;
  END IF;
  
  RETURN v_setlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Row-Level Security

### 6.1 Public Read Access
```sql
-- Enable RLS on all tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to core data
CREATE POLICY public_read_artists ON artists
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_venues ON venues
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_shows ON shows
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_setlists ON setlists
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_setlist_songs ON setlist_songs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_songs ON songs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_homepage_cache ON homepage_cache
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY public_read_zip_codes ON zip_codes
  FOR SELECT TO anon, authenticated USING (true);
```

### 6.2 Authenticated User Permissions
```sql
-- Users can only insert/update their own votes
CREATE POLICY user_votes_policy ON votes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read all votes
CREATE POLICY public_read_votes ON votes
  FOR SELECT TO anon, authenticated USING (true);
```

### 6.3 Admin Permissions
```sql
-- Admin users can modify core data
CREATE POLICY admin_full_access ON artists
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Repeat for other tables as needed
```

---

## 7. Indexes & Performance

### 7.1 Critical Performance Indexes
```sql
-- Artists - search and popularity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_name_trgm 
  ON artists USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artists_popularity_desc 
  ON artists(popularity DESC) WHERE popularity > 0;

-- Shows - status and date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_status_date 
  ON shows(status, date) WHERE status = 'upcoming';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shows_artist_upcoming 
  ON shows(artist_id, date) WHERE status = 'upcoming';

-- Venues - spatial queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_venues_location_gist 
  ON venues USING GIST(location) WHERE location IS NOT NULL;

-- Setlists and votes - aggregation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_setlist_songs_votes 
  ON setlist_songs(setlist_id, vote_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_show 
  ON votes(user_id, show_id);

-- ZIP codes - location search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_zip_codes_location 
  ON zip_codes USING GIST(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
```

### 7.2 Query Optimization
```sql
-- Analyze tables for better query planning
ANALYZE artists;
ANALYZE venues;
ANALYZE shows;
ANALYZE setlists;
ANALYZE setlist_songs;
ANALYZE votes;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;
```

---

## 8. Data Validation Rules

### 8.1 Data Integrity Triggers
```sql
-- Prevent vote count from going negative
CREATE OR REPLACE FUNCTION check_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_count < 0 THEN
    RAISE EXCEPTION 'Vote count cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER setlist_songs_vote_check
  BEFORE UPDATE ON setlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION check_vote_count();

-- Ensure show dates are reasonable
CREATE OR REPLACE FUNCTION check_show_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date < '2020-01-01' OR NEW.date > '2030-12-31' THEN
    RAISE EXCEPTION 'Show date must be between 2020 and 2030';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shows_date_check
  BEFORE INSERT OR UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION check_show_date();
```

### 8.2 Data Quality Functions
```sql
-- Function to find and report duplicate artists
CREATE OR REPLACE FUNCTION find_duplicate_artists()
RETURNS TABLE (
  name text,
  count bigint,
  ids uuid[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    COUNT(*) as count,
    array_agg(a.id) as ids
  FROM artists a
  GROUP BY lower(trim(a.name))
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS jsonb AS $$
DECLARE
  deleted_count integer;
  result jsonb;
BEGIN
  -- Delete setlist_songs without valid setlists
  DELETE FROM setlist_songs 
  WHERE setlist_id NOT IN (SELECT id FROM setlists);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := jsonb_build_object('setlist_songs_deleted', deleted_count);
  
  -- Delete votes without valid users or shows
  DELETE FROM votes 
  WHERE show_id NOT IN (SELECT id FROM shows);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := result || jsonb_build_object('votes_deleted', deleted_count);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Backup & Recovery

### 9.1 Automated Backups
Supabase automatically handles backups, but we should also implement:

```sql
-- Function to export critical data
CREATE OR REPLACE FUNCTION export_critical_data()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'export_date', NOW(),
    'artists_count', (SELECT COUNT(*) FROM artists),
    'shows_count', (SELECT COUNT(*) FROM shows WHERE status = 'upcoming'),
    'votes_count', (SELECT COUNT(*) FROM votes),
    'cache_status', (
      SELECT jsonb_object_agg(cache_key, expires_at > NOW())
      FROM homepage_cache
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Data Validation Queries
```sql
-- Check data consistency
SELECT 
  'artists' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE slug IS NOT NULL) as with_slug,
  COUNT(*) FILTER (WHERE image_url IS NOT NULL) as with_image
FROM artists

UNION ALL

SELECT 
  'shows' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
  COUNT(*) FILTER (WHERE date >= CURRENT_DATE) as future
FROM shows

UNION ALL

SELECT 
  'venues' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE location IS NOT NULL) as with_location,
  COUNT(*) FILTER (WHERE capacity IS NOT NULL) as with_capacity
FROM venues;
```

---

**Next:** [Part 3 - Edge Functions & Backend](./MASTER-FIX-P3-BACKEND.md) 