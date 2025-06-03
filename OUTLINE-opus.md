I'll help you create a comprehensive outline for completing your setlist voting app. Let me start by reviewing your GitHub repository to understand the current state of the project.Based on my review of your project and database, I'll create a comprehensive rewrite plan that incorporates everything from the original outline plus the necessary updates. Here's the complete plan:

# SETLIST-SCORE-SHOW – COMPLETE REWRITE PLAN v2.0
Version: 2025-06-03  
Audience: A mid-level developer who needs to transform the existing app into a production-ready system  
Scope: Complete architectural overhaul, database schema fixes, UI redesign with teal gradient theme, and all fixes from CLAUDE-2.md and CLAUDE.md

## 0. EXECUTIVE SUMMARY & QUICK START
────────────────────────────────────────
**Current State**: Single React/Vite app with Supabase backend, basic voting functionality  
**Target State**: Turbo monorepo with Next.js 14, Fastify GraphQL API, real-time updates, automated sync

### Quick Start After Implementation:
```bash
# 1. Clone and setup
git clone git@github.com:swbam/setlist-score-show.git
cd setlist-score-show

# 2. Install dependencies
pnpm install

# 3. Environment setup
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SETLIST_FM_API_KEY, etc.

# 4. Start services
docker compose up -d  # PostgreSQL + Redis
pnpm dev              # Starts all apps

# 5. Access
# Web: http://localhost:3000
# API: http://localhost:4000/graphql
```

## 1. PROJECT ARCHITECTURE OVERVIEW
──────────────────────────────────
**Purpose**: Enable fans to vote on songs they want to hear at upcoming concerts. Artists see real-time rankings.

### Monorepo Structure (Turborepo):
```
setlist-score-show/
├── apps/
│   ├── web/              # Next.js 14 (App Router)
│   └── api/              # Fastify + GraphQL + tRPC
├── packages/
│   ├── database/         # Prisma schema & client
│   ├── ui/              # Shared components (shadcn/ui based)
│   ├── config/          # Shared configs (TypeScript, ESLint, etc.)
│   └── types/           # Shared TypeScript types
├── infra/
│   ├── docker/          # Docker configurations
│   └── scripts/         # Migration & setup scripts
├── .github/
│   └── workflows/       # CI/CD & cron jobs
└── docs/               # Architecture & API documentation
```

### Tech Stack:
- **Frontend**: Next.js 14 (App Router), React 18, TanStack Query, Tailwind CSS
- **Backend**: Fastify, GraphQL (Mercurius), tRPC for subscriptions
- **Database**: PostgreSQL 15 (via Supabase), Redis 7
- **Auth**: Supabase Auth (replacing Clerk as mentioned in outline)
- **External APIs**: Setlist.fm, Spotify Web API, Ticketmaster Discovery API
- **Deployment**: Vercel (web), Railway/Fly.io (API), Supabase (DB)

## 2. DATABASE SCHEMA REDESIGN
─────────────────────────────
**Critical Issues Fixed**:
- Missing unique constraints causing duplicates
- Nullable foreign keys breaking referential integrity
- No composite indexes for performance
- Incorrect vote tracking structure

### Complete Schema:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- Core tables with proper constraints
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotify_id TEXT UNIQUE,
  ticketmaster_id TEXT,
  setlistfm_mbid TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  genres TEXT[],
  popularity INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_ids UNIQUE NULLS NOT DISTINCT (spotify_id, ticketmaster_id)
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticketmaster_id TEXT UNIQUE,
  setlistfm_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  ticketmaster_id TEXT UNIQUE,
  setlistfm_id TEXT UNIQUE,
  date DATE NOT NULL,
  start_time TIME,
  doors_time TIME,
  title TEXT,
  tour_name TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  ticketmaster_url TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show UNIQUE (artist_id, venue_id, date)
);

CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  spotify_id TEXT UNIQUE,
  musicbrainz_id TEXT UNIQUE,
  title TEXT NOT NULL,
  album TEXT,
  album_image_url TEXT,
  duration_ms INTEGER,
  popularity INTEGER DEFAULT 0,
  preview_url TEXT,
  spotify_url TEXT,
  audio_features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_artist_song UNIQUE (artist_id, title, album)
);

CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main Set',
  order_index INTEGER DEFAULT 0,
  is_encore BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_show_setlist UNIQUE (show_id, order_index)
);

CREATE TABLE setlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  vote_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_setlist_position UNIQUE (setlist_id, position),
  CONSTRAINT unique_setlist_song UNIQUE (setlist_id, song_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  spotify_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setlist_song_id UUID NOT NULL REFERENCES setlist_songs(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_song_vote UNIQUE (user_id, setlist_song_id),
  CONSTRAINT max_show_votes CHECK (
    (SELECT COUNT(*) FROM votes v WHERE v.user_id = votes.user_id AND v.show_id = votes.show_id) <= 10
  )
);

CREATE TABLE vote_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  daily_votes INTEGER DEFAULT 0,
  show_votes INTEGER DEFAULT 0,
  last_vote_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_show_analytics UNIQUE (user_id, show_id)
);

CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('setlistfm', 'spotify', 'ticketmaster')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'show', 'song', 'setlist')),
  entity_id UUID,
  external_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  error_message TEXT,
  items_processed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX idx_shows_artist_date ON shows(artist_id, date DESC);
CREATE INDEX idx_votes_user_created ON votes(user_id, created_at DESC);
CREATE INDEX idx_setlist_songs_votes ON setlist_songs(vote_count DESC);
CREATE INDEX idx_songs_title_trgm ON songs USING gin(title gin_trgm_ops);
CREATE INDEX idx_artists_name_trgm ON artists USING gin(name gin_trgm_ops);

-- Materialized view for trending shows
CREATE MATERIALIZED VIEW trending_shows AS
SELECT 
  s.id as show_id,
  s.artist_id,
  s.venue_id,
  s.date as show_date,
  s.title as show_name,
  s.status as show_status,
  s.view_count,
  COALESCE(vote_stats.total_votes, 0) as total_votes,
  COALESCE(vote_stats.unique_voters, 0) as unique_voters,
  COALESCE(vote_stats.avg_votes_per_song, 0) as avg_votes_per_song,
  (
    s.view_count * 0.3 + 
    COALESCE(vote_stats.total_votes, 0) * 0.4 +
    COALESCE(vote_stats.unique_voters, 0) * 0.3
  ) * 
  CASE 
    WHEN s.date <= CURRENT_DATE + INTERVAL '7 days' THEN 2.0
    WHEN s.date <= CURRENT_DATE + INTERVAL '30 days' THEN 1.5
    WHEN s.date <= CURRENT_DATE + INTERVAL '90 days' THEN 1.0
    ELSE 0.5
  END as trending_score
FROM shows s
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT v.id) as total_votes,
    COUNT(DISTINCT v.user_id) as unique_voters,
    AVG(ss.vote_count) as avg_votes_per_song
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists sl ON ss.setlist_id = sl.id
  WHERE sl.show_id = s.id
) vote_stats ON true
WHERE s.date >= CURRENT_DATE
AND s.status != 'cancelled';

CREATE UNIQUE INDEX idx_trending_shows_id ON trending_shows(show_id);

-- RLS Policies
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);
CREATE POLICY "Public read access" ON setlist_songs FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read all votes" ON votes FOR SELECT USING (true);
```

## 3. MONOREPO SETUP & CONFIGURATION
────────────────────────────────────

### Root Configuration Files:

**package.json**:
```json
{
  "name": "setlist-score-show",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "db:migrate": "pnpm --filter @setlist/database migrate",
    "db:push": "pnpm --filter @setlist/database push",
    "db:seed": "pnpm --filter @setlist/database seed",
    "sync:setlists": "pnpm --filter @setlist/api sync:setlists"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*", "DATABASE_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

## 4. WEB APPLICATION (Next.js 14)
─────────────────────────────────

### Project Structure:
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Homepage
│   │   ├── shows/
│   │   │   ├── page.tsx          # All shows
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Show detail + voting
│   │   │       └── loading.tsx
│   │   └── artists/
│   │       ├── page.tsx          # All artists
│   │       └── [slug]/
│   │           └── page.tsx      # Artist shows
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts      # tRPC handler
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles with teal theme
├── components/
│   ├── ui/                       # Shadcn components
│   ├── shows/
│   │   ├── ShowCard.tsx
│   │   ├── ShowList.tsx
│   │   └── TrendingShows.tsx
│   ├── voting/
│   │   ├── VoteButton.tsx
│   │   ├── SongList.tsx
│   │   └── VoteProgress.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/
│   ├── useVoting.ts
│   ├── useRealtimeUpdates.ts
│   └── useAuth.ts
├── lib/
│   ├── trpc.ts
│   ├── supabase.ts
│   └── utils.ts
└── styles/
    └── theme.ts                  # Teal gradient theme config
```

### Key Component: VoteButton with Teal Theme
```tsx
// components/voting/VoteButton.tsx
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, Check } from 'lucide-react'
import { useVoting } from '@/hooks/useVoting'
import { motion, AnimatePresence } from 'framer-motion'

interface VoteButtonProps {
  songId: string
  showId: string
  currentVotes: number
  hasVoted: boolean
  position: number
}

export function VoteButton({ 
  songId, 
  showId, 
  currentVotes, 
  hasVoted, 
  position 
}: VoteButtonProps) {
  const { vote, isVoting } = useVoting()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleVote = async () => {
    if (hasVoted || isVoting) return
    
    const result = await vote({ songId, showId })
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: hasVoted ? 1 : 1.05 }}
      whileTap={{ scale: hasVoted ? 1 : 0.95 }}
      onClick={handleVote}
      disabled={hasVoted || isVoting}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
        hasVoted
          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
          : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700"
      )}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"
          >
            <Check className="w-5 h-5 text-white" />
          </motion.div>
        ) : (
          <>
            <ChevronUp className={cn(
              "w-5 h-5 transition-transform",
              hasVoted && "text-white"
            )} />
            <span className="min-w-[3ch] text-center">{currentVotes}</span>
            {!hasVoted && <span className="text-sm opacity-70">Vote</span>}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
```

### Theme Configuration:
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    
    /* Teal gradient theme colors */
    --primary: 173 80% 40%;
    --primary-foreground: 0 0% 98%;
    --accent: 172 66% 50%;
    --accent-foreground: 0 0% 9%;
    
    /* Gradient definitions */
    --gradient-primary: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%);
    --gradient-hover: linear-gradient(135deg, #0f766e 0%, #0891b2 100%);
    --gradient-active: linear-gradient(135deg, #134e4a 0%, #0c4a6e 100%);
  }
}

@layer components {
  .gradient-border {
    @apply relative;
    background: linear-gradient(var(--background), var(--background)) padding-box,
                var(--gradient-primary) border-box;
    border: 2px solid transparent;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent;
  }
  
  .card-hover {
    @apply transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1;
  }
}
```

## 5. API SERVICE (Fastify + GraphQL)
────────────────────────────────────

### Project Structure:
```
apps/api/
├── src/
│   ├── index.ts                  # Entry point
│   ├── server.ts                 # Fastify setup
│   ├── schema/
│   │   ├── index.ts             # GraphQL schema
│   │   ├── artist.graphql
│   │   ├── show.graphql
│   │   ├── song.graphql
│   │   └── vote.graphql
│   ├── resolvers/
│   │   ├── index.ts
│   │   ├── artist.resolver.ts
│   │   ├── show.resolver.ts
│   │   ├── song.resolver.ts
│   │   └── vote.resolver.ts
│   ├── services/
│   │   ├── voting.service.ts
│   │   ├── sync.service.ts
│   │   └── analytics.service.ts
│   ├── jobs/
│   │   ├── sync-setlists.ts
│   │   ├── sync-spotify.ts
│   │   └── calculate-trending.ts
│   ├── lib/
│   │   ├── redis.ts
│   │   ├── prisma.ts
│   │   ├── setlistfm.ts
│   │   └── spotify.ts
│   └── plugins/
│       ├── auth.ts
│       ├── ratelimit.ts
│       └── websocket.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

### Core Server Setup:
```typescript
// src/server.ts
import Fastify from 'fastify'
import mercurius from 'mercurius'
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { schema } from './schema'
import { resolvers } from './resolvers'
import { authPlugin } from './plugins/auth'
import { rateLimitPlugin } from './plugins/ratelimit'
import { websocketPlugin } from './plugins/websocket'

export async function createServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    }
  })

  // Database & Redis
  const prisma = new PrismaClient()
  const redis = new Redis(process.env.REDIS_URL!)

  app.decorate('prisma', prisma)
  app.decorate('redis', redis)

  // Plugins
  await app.register(authPlugin)
  await app.register(rateLimitPlugin)
  await app.register(websocketPlugin)

  // GraphQL
  await app.register(mercurius, {
    schema,
    resolvers,
    context: async (request, reply) => ({
      prisma,
      redis,
      user: request.user,
      pubsub: app.pubsub
    }),
    subscription: {
      context: async (connection, request) => ({
        prisma,
        redis,
        user: connection.context.user,
        pubsub: app.pubsub
      })
    },
    graphiql: process.env.NODE_ENV !== 'production'
  })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))

  return app
}
```

### Voting Service with Transaction & Rate Limiting:
```typescript
// src/services/voting.service.ts
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { TRPCError } from '@trpc/server'

interface VoteInput {
  userId: string
  showId: string
  songId: string
  setlistSongId: string
}

export class VotingService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {}

  async castVote(input: VoteInput) {
    const { userId, showId, songId, setlistSongId } = input

    // Rate limiting check
    const rateLimitKey = `ratelimit:vote:${userId}`
    const attempts = await this.redis.incr(rateLimitKey)
    
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 60) // 1 minute window
    }
    
    if (attempts > 5) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Try again in a minute.'
      })
    }

    // Check vote limits
    const [dailyVotes, showVotes] = await Promise.all([
      this.prisma.vote.count({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.vote.count({
        where: {
          user_id: userId,
          show_id: showId
        }
      })
    ])

    if (dailyVotes >= 50) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Daily vote limit reached (50 votes)'
      })
    }

    if (showVotes >= 10) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Show vote limit reached (10 votes per show)'
      })
    }

    // Transaction for vote
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if already voted
      const existingVote = await tx.vote.findUnique({
        where: {
          unique_user_song_vote: {
            user_id: userId,
            setlist_song_id: setlistSongId
          }
        }
      })

      if (existingVote) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already voted for this song'
        })
      }

      // Create vote
      const vote = await tx.vote.create({
        data: {
          user_id: userId,
          setlist_song_id: setlistSongId,
          show_id: showId,
          vote_type: 'up'
        }
      })

      // Update vote count
      await tx.setlistSong.update({
        where: { id: setlistSongId },
        data: {
          vote_count: {
            increment: 1
          }
        }
      })

      // Update analytics
      await tx.voteAnalytics.upsert({
        where: {
          unique_user_show_analytics: {
            user_id: userId,
            show_id: showId
          }
        },
        create: {
          user_id: userId,
          show_id: showId,
          daily_votes: 1,
          show_votes: 1,
          last_vote_at: new Date()
        },
        update: {
          daily_votes: {
            increment: 1
          },
          show_votes: {
            increment: 1
          },
          last_vote_at: new Date()
        }
      })

      return vote
    })

    // Invalidate cache
    await this.redis.del(`show:${showId}:songs`)
    
    // Publish update
    await this.redis.publish(`show:${showId}:updates`, JSON.stringify({
      type: 'vote_cast',
      data: {
        setlistSongId,
        userId
      }
    }))

    return {
      success: true,
      voteId: result.id,
      dailyVotesRemaining: 50 - dailyVotes - 1,
      showVotesRemaining: 10 - showVotes - 1
    }
  }
}
```

## 6. SYNC JOBS & EXTERNAL INTEGRATIONS
───────────────────────────────────────

### Setlist.fm Sync Job:
```typescript
// src/jobs/sync-setlists.ts
import { PrismaClient } from '@setlist/database'
import pLimit from 'p-limit'
import { SetlistFmClient } from '../lib/setlistfm'
import { SpotifyClient } from '../lib/spotify'

export class SetlistSyncJob {
  private limit = pLimit(3) // Max 3 concurrent API calls
  
  constructor(
    private prisma: PrismaClient,
    private setlistFm: SetlistFmClient,
    private spotify: SpotifyClient
  ) {}

  async syncYesterdaysShows() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const dateStr = yesterday.toISOString().split('T')[0]
    
    console.log(`Starting sync for ${dateStr}`)
    
    // Get all tracked artists
    const artists = await this.prisma.artist.findMany({
      where: {
        setlistfm_mbid: { not: null }
      }
    })

    // Sync each artist's shows
    const results = await Promise.allSettled(
      artists.map((artist) => 
        this.limit(() => this.syncArtistShows(artist, dateStr))
      )
    )

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    console.log(`Sync complete: ${successful} successful, ${failed} failed`)
  }

  private async syncArtistShows(artist: any, date: string) {
    try {
      const setlists = await this.setlistFm.getArtistSetlists(
        artist.setlistfm_mbid,
        date
      )

      for (const setlist of setlists) {
        await this.prisma.$transaction(async (tx) => {
          // Upsert venue
          const venue = await tx.venue.upsert({
            where: {
              setlistfm_id: setlist.venue.id
            },
            create: {
              setlistfm_id: setlist.venue.id,
              name: setlist.venue.name,
              city: setlist.venue.city.name,
              state: setlist.venue.city.state,
              country: setlist.venue.city.country.name,
              latitude: setlist.venue.city.coords?.lat,
              longitude: setlist.venue.city.coords?.long
            },
            update: {}
          })

          // Create show
          const show = await tx.show.create({
            data: {
              artist_id: artist.id,
              venue_id: venue.id,
              setlistfm_id: setlist.id,
              date: new Date(setlist.eventDate),
              title: setlist.tour?.name || `${artist.name} at ${venue.name}`,
              tour_name: setlist.tour?.name,
              status: 'completed'
            }
          })

          // Create setlist and songs
          const mainSetlist = await tx.setlist.create({
            data: {
              show_id: show.id,
              name: 'Main Set',
              order_index: 0
            }
          })

          // Process songs
          let position = 1
          for (const set of setlist.sets.set) {
            for (const song of set.song) {
              // Try to match with existing song
              let dbSong = await tx.song.findFirst({
                where: {
                  artist_id: artist.id,
                  title: {
                    equals: song.name,
                    mode: 'insensitive'
                  }
                }
              })

              // If not found, try Spotify search
              if (!dbSong && artist.spotify_id) {
                const spotifyTrack = await this.spotify.searchTrack(
                  song.name,
                  artist.name
                )
                
                if (spotifyTrack) {
                  dbSong = await tx.song.create({
                    data: {
                      artist_id: artist.id,
                      spotify_id: spotifyTrack.id,
                      title: spotifyTrack.name,
                      album: spotifyTrack.album.name,
                      album_image_url: spotifyTrack.album.images[0]?.url,
                      duration_ms: spotifyTrack.duration_ms,
                      popularity: spotifyTrack.popularity,
                      preview_url: spotifyTrack.preview_url,
                      spotify_url: spotifyTrack.external_urls.spotify
                    }
                  })
                }
              }

              // Create as unmatched song if still not found
              if (!dbSong) {
                dbSong = await tx.song.create({
                  data: {
                    artist_id: artist.id,
                    title: song.name,
                    album: 'Unknown'
                  }
                })
              }

              // Add to setlist
              await tx.setlistSong.create({
                data: {
                  setlist_id: mainSetlist.id,
                  song_id: dbSong.id,
                  position: position++
                }
              })
            }
          }

          // Log sync
          await tx.syncHistory.create({
            data: {
              sync_type: 'setlistfm',
              entity_type: 'setlist',
              entity_id: show.id,
              external_id: setlist.id,
              status: 'completed',
              items_processed: position - 1
            }
          })
        })
      }
    } catch (error) {
      console.error(`Failed to sync artist ${artist.name}:`, error)
      
      await this.prisma.syncHistory.create({
        data: {
          sync_type: 'setlistfm',
          entity_type: 'artist',
          entity_id: artist.id,
          status: 'failed',
          error_message: error.message
        }
      })
      
      throw error
    }
  }
}
```

## 7. REAL-TIME UPDATES (WebSocket/SSE)
──────────────────────────────────────

### WebSocket Plugin:
```typescript
// src/plugins/websocket.ts
import fp from 'fastify-plugin'
import { createPubSub } from 'graphql-yoga'

export const websocketPlugin = fp(async (app) => {
  const pubsub = createPubSub()
  
  app.decorate('pubsub', pubsub)
  
  // Redis subscriber for cross-server updates
  const subscriber = app.redis.duplicate()
  
  subscriber.on('message', (channel, message) => {
    if (channel.startsWith('show:') && channel.endsWith(':updates')) {
      const showId = channel.split(':')[1]
      const update = JSON.parse(message)
      
      pubsub.publish(`SHOW_${showId}_UPDATED`, {
        showUpdated: {
          showId,
          type: update.type,
          data: update.data
        }
      })
    }
  })
  
  subscriber.subscribe('show:*:updates')
  
  app.addHook('onClose', async () => {
    await subscriber.quit()
  })
})
```

### GraphQL Subscription:
```graphql
# src/schema/subscription.graphql
type Subscription {
  showUpdated(showId: ID!): ShowUpdate!
}

type ShowUpdate {
  showId: ID!
  type: UpdateType!
  data: JSON!
}

enum UpdateType {
  VOTE_CAST
  VOTE_REMOVED
  SONG_ADDED
  SONG_REMOVED
  SHOW_UPDATED
}
```

## 8. DEPLOYMENT & INFRASTRUCTURE
─────────────────────────────────

### Docker Compose for Development:
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: setlist_score_show
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: ./infra/docker/api.Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/setlist_score_show
      REDIS_URL: redis://redis:6379
    ports:
      - '4000:4000'
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages

volumes:
  postgres_data:
  redis_data:
```

### GitHub Actions for CI/CD:
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Run type checks
        run: pnpm type-check
      
      - name: Run linting
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  deploy-web:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        run: |
          pnpm dlx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-api:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        run: |
          pnpm dlx @railway/cli@latest up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Cron Job for Daily Sync:
```yaml
# .github/workflows/daily-sync.yml
name: Daily Setlist Sync

on:
  schedule:
    - cron: '0 2 * * *' # 2 AM UTC daily
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      
      - name: Run setlist sync
        run: pnpm --filter @setlist/api sync:setlists
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          REDIS_URL: ${{ secrets.REDIS_URL }}
          SETLIST_FM_API_KEY: ${{ secrets.SETLIST_FM_API_KEY }}
          SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
          SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
      
      - name: Calculate trending scores
        run: pnpm --filter @setlist/api calculate:trending
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 9. MIGRATION PLAN
───────────────────

### Phase 1: Database Migration (Week 1)
1. Backup existing Supabase database
2. Create migration scripts to transform schema
3. Test migrations on staging environment
4. Run migrations with zero downtime approach
5. Verify data integrity

### Phase 2: Monorepo Setup (Week 1-2)
1. Initialize Turborepo structure
2. Move existing React code to `apps/web-legacy`
3. Create new Next.js app in `apps/web`
4. Setup Fastify API in `apps/api`
5. Configure shared packages

### Phase 3: Feature Parity (Week 2-3)
1. Implement authentication flow
2. Port voting functionality
3. Add real-time updates
4. Implement show listing/search
5. Add artist pages

### Phase 4: New Features (Week 3-4)
1. Implement external API syncs
2. Add trending calculations
3. Create admin dashboard
4. Add analytics tracking
5. Implement notification system

### Phase 5: Testing & Launch (Week 4)
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Gradual rollout
5. Monitor and iterate

## 10. TESTING STRATEGY
────────────────────

### Unit Tests:
```typescript
// apps/api/src/services/__tests__/voting.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis-mock'
import { VotingService } from '../voting.service'

describe('VotingService', () => {
  let service: VotingService
  let prisma: PrismaClient
  let redis: Redis

  beforeEach(() => {
    prisma = new PrismaClient()
    redis = new Redis()
    service = new VotingService(prisma, redis)
  })

  describe('castVote', () => {
    it('should successfully cast a vote', async () => {
      const input = {
        userId: 'user-123',
        showId: 'show-123',
        songId: 'song-123',
        setlistSongId: 'setlist-song-123'
      }

      const result = await service.castVote(input)

      expect(result.success).toBe(true)
      expect(result.dailyVotesRemaining).toBe(49)
      expect(result.showVotesRemaining).toBe(9)
    })

    it('should enforce daily vote limit', async () => {
      // Mock 50 existing votes
      jest.spyOn(prisma.vote, 'count').mockResolvedValueOnce(50)

      await expect(service.castVote({
        userId: 'user-123',
        showId: 'show-123',
        songId: 'song-123',
        setlistSongId: 'setlist-song-123'
      })).rejects.toThrow('Daily vote limit reached')
    })
  })
})
```

### E2E Tests:
```typescript
// apps/web/e2e/voting.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Voting Flow', () => {
  test('user can vote for songs', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to show
    await page.goto('/shows/upcoming')
    await page.click('text="Coldplay at Madison Square Garden"')

    // Vote for song
    await page.click('button:has-text("Vote"):near(text="Yellow")')
    
    // Verify vote was recorded
    await expect(page.locator('text="Vote recorded"')).toBeVisible()
    await expect(page.locator('button:has-text("Voted"):near(text="Yellow")')).toBeDisabled()
  })
})
```

## 11. MONITORING & OBSERVABILITY
─────────────────────────────────

### Error Tracking (Sentry):
```typescript
// apps/api/src/plugins/monitoring.ts
import * as Sentry from '@sentry/node'
import fp from 'fastify-plugin'

export const monitoringPlugin = fp(async (app) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Postgres(),
    ],
    tracesSampleRate: 0.1,
  })

  app.addHook('onRequest', async (request, reply) => {
    request.sentryScope = Sentry.getCurrentHub().pushScope()
  })

  app.addHook('onResponse', async (request, reply) => {
    request.sentryScope?.popScope()
  })

  app.setErrorHandler((error, request, reply) => {
    Sentry.captureException(error, {
      contexts: {
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          query: request.query,
        }
      },
      user: request.user ? {
        id: request.user.id,
        email: request.user.email
      } : undefined
    })

    reply.status(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  })
})
```

## 12. PERFORMANCE OPTIMIZATIONS
────────────────────────────────

### Database Optimizations:
- Partial indexes for active shows
- Materialized views for trending data
- Connection pooling with pgBouncer
- Query result caching in Redis

### Frontend Optimizations:
- Static generation for artist/venue pages
- ISR for show pages (revalidate every 5 minutes)
- Image optimization with Next.js Image
- Bundle splitting and lazy loading
- Service worker for offline support

### API Optimizations:
- DataLoader pattern for N+1 prevention
- Redis caching with smart invalidation
- Request batching for GraphQL
- CDN for static assets

## 13. SECURITY CONSIDERATIONS
──────────────────────────────

- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection with proper escaping
- CSRF tokens for state-changing operations
- Rate limiting on all endpoints
- API key rotation schedule
- Secrets management with HashiCorp Vault
- Regular dependency updates
- Security headers (CSP, HSTS, etc.)

## 14. TROUBLESHOOTING GUIDE
────────────────────────────

### Common Issues:

**Database Connection Errors**
```bash
# Check if Postgres is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset database
pnpm db:reset
```

**Redis Connection Issues**
```bash
# Check Redis
redis-cli ping

# Clear cache
redis-cli FLUSHALL
```

**Build Failures**
```bash
# Clear all caches
pnpm clean
rm -rf node_modules .turbo
pnpm install
pnpm build
```

**Sync Job Failures**
- Check API keys are valid
- Verify rate limits haven't been hit
- Check logs: `pnpm logs:sync`
- Manual retry: `pnpm sync:setlists --date=2024-06-02`

## 15. FUTURE ENHANCEMENTS
────────────────────────

1. **Mobile Apps**: React Native apps for iOS/Android
2. **AI Predictions**: ML model to predict likely setlists
3. **Social Features**: Follow friends, share votes
4. **Artist Dashboard**: Direct artist engagement
5. **Playlist Generation**: Auto-create Spotify playlists
6. **Gamification**: Badges, leaderboards, achievements
7. **Multi-language**: i18n support for global audience
8. **Offline Mode**: PWA with background sync
9. **Voice Voting**: Alexa/Google Assistant integration
10. **Blockchain Voting**: Transparent, immutable votes

---

This comprehensive plan provides a complete roadmap for transforming your setlist voting app into a production-ready system with modern architecture, scalable infrastructure, and delightful user experience with the teal gradient theme you requested.