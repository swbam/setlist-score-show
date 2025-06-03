# **SETLIST-SCORE-SHOW – COMPLETE REWRITE PLAN v2.0**

Version: 2025-06-03  
 Audience: A mid-level developer who needs to transform the existing app into a production-ready system  
 Scope: Complete architectural overhaul, database schema fixes, UI redesign with teal gradient theme, and all fixes from CLAUDE-2.md and CLAUDE.md

## **0\. EXECUTIVE SUMMARY & QUICK START**

──────────────────────────────────────── **Current State**: Single React/Vite app with Supabase backend, basic voting functionality  
 **Target State**: Turbo monorepo with Next.js 14, Fastify GraphQL API, real-time updates via Supabase Realtime, automated sync

### **Quick Start After Implementation:**

\# 1\. Clone and setup  
git clone git@github.com:swbam/setlist-score-show.git  
cd setlist-score-show

\# 2\. Install dependencies  
pnpm install

\# 3\. Environment setup  
cp apps/web/.env.example apps/web/.env.local  
cp apps/api/.env.example apps/api/.env  
\# Fill in: SUPABASE\_URL, SUPABASE\_ANON\_KEY, SETLIST\_FM\_API\_KEY, etc.

\# 4\. Start services  
docker compose up \-d  \# PostgreSQL \+ Redis  
pnpm dev              \# Starts all apps

\# 5\. Access  
\# Web: http://localhost:3000  
\# API: http://localhost:4000/graphql

## **1\. PROJECT ARCHITECTURE OVERVIEW**

────────────────────────────────── **Purpose**: Enable fans to vote on songs they want to hear at upcoming concerts. Artists see real-time rankings.

### **Monorepo Structure (Turborepo):**

setlist-score-show/  
├── apps/  
│   ├── web/              \# Next.js 14 (App Router)  
│   └── api/              \# Fastify \+ GraphQL \+ Supabase Realtime  
├── packages/  
│   ├── database/         \# Prisma schema & client  
│   ├── ui/              \# Shared components (shadcn/ui based)  
│   ├── config/          \# Shared configs (TypeScript, ESLint, etc.)  
│   └── types/           \# Shared TypeScript types  
├── infra/  
│   ├── docker/          \# Docker configurations  
│   └── scripts/         \# Migration & setup scripts  
├── .github/  
│   └── workflows/       \# CI/CD & cron jobs  
└── docs/               \# Architecture & API documentation

### **Tech Stack:**

* **Frontend**: Next.js 14 (App Router), React 18, TanStack Query, Tailwind CSS  
* **Backend**: Fastify, GraphQL (Mercurius), Supabase Realtime for live updates  
* **Database**: PostgreSQL 15 (via Supabase), Redis 7  
* **Auth**: Supabase Auth  
* **Real-time**: Supabase Realtime (replacing WebSockets)  
* **External APIs**: Setlist.fm, Spotify Web API, Ticketmaster Discovery API  
* **Deployment**: Vercel (web), Railway/Fly.io (API), Supabase (DB)

## **2\. DATABASE SCHEMA REDESIGN**

───────────────────────────── **Critical Issues Fixed**:

* Missing unique constraints causing duplicates  
* Nullable foreign keys breaking referential integrity  
* No composite indexes for performance  
* Incorrect vote tracking structure

### **Complete Schema:**

\-- Enable required extensions  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  
CREATE EXTENSION IF NOT EXISTS "pg\_trgm"; \-- For fuzzy search

\-- Core tables with proper constraints  
CREATE TABLE artists (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  spotify\_id TEXT UNIQUE,  
  ticketmaster\_id TEXT,  
  setlistfm\_mbid TEXT UNIQUE,  
  name TEXT NOT NULL,  
  slug TEXT UNIQUE NOT NULL,  
  image\_url TEXT,  
  genres TEXT\[\],  
  popularity INTEGER DEFAULT 0,  
  followers INTEGER DEFAULT 0,  
  last\_synced\_at TIMESTAMPTZ DEFAULT NOW(),  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_artist\_ids UNIQUE NULLS NOT DISTINCT (spotify\_id, ticketmaster\_id)  
);

CREATE TABLE venues (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  ticketmaster\_id TEXT UNIQUE,  
  setlistfm\_id TEXT UNIQUE,  
  name TEXT NOT NULL,  
  address TEXT,  
  city TEXT NOT NULL,  
  state TEXT,  
  country TEXT NOT NULL,  
  postal\_code TEXT,  
  latitude DECIMAL(10, 8),  
  longitude DECIMAL(11, 8),  
  timezone TEXT,  
  capacity INTEGER,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE TABLE shows (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  artist\_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,  
  venue\_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,  
  ticketmaster\_id TEXT UNIQUE,  
  setlistfm\_id TEXT UNIQUE,  
  date DATE NOT NULL,  
  start\_time TIME,  
  doors\_time TIME,  
  title TEXT,  
  tour\_name TEXT,  
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),  
  ticketmaster\_url TEXT,  
  view\_count INTEGER DEFAULT 0,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_show UNIQUE (artist\_id, venue\_id, date)  
);

CREATE TABLE songs (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  artist\_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,  
  spotify\_id TEXT UNIQUE,  
  musicbrainz\_id TEXT UNIQUE,  
  title TEXT NOT NULL,  
  album TEXT,  
  album\_image\_url TEXT,  
  duration\_ms INTEGER,  
  popularity INTEGER DEFAULT 0,  
  preview\_url TEXT,  
  spotify\_url TEXT,  
  audio\_features JSONB,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_artist\_song UNIQUE (artist\_id, title, album)  
);

CREATE TABLE setlists (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  show\_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,  
  name TEXT DEFAULT 'Main Set',  
  order\_index INTEGER DEFAULT 0,  
  is\_encore BOOLEAN DEFAULT FALSE,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_show\_setlist UNIQUE (show\_id, order\_index)  
);

CREATE TABLE setlist\_songs (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  setlist\_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,  
  song\_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,  
  position INTEGER NOT NULL,  
  vote\_count INTEGER DEFAULT 0,  
  notes TEXT,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_setlist\_position UNIQUE (setlist\_id, position),  
  CONSTRAINT unique\_setlist\_song UNIQUE (setlist\_id, song\_id)  
);

CREATE TABLE users (  
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
  email TEXT,  
  display\_name TEXT,  
  avatar\_url TEXT,  
  spotify\_id TEXT UNIQUE,  
  preferences JSONB DEFAULT '{}',  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE TABLE votes (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
  setlist\_song\_id UUID NOT NULL REFERENCES setlist\_songs(id) ON DELETE CASCADE,  
  show\_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,  
  vote\_type TEXT NOT NULL DEFAULT 'up' CHECK (vote\_type IN ('up', 'down')),  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_user\_song\_vote UNIQUE (user\_id, setlist\_song\_id),  
  CONSTRAINT max\_show\_votes CHECK (  
    (SELECT COUNT(\*) FROM votes v WHERE v.user\_id \= votes.user\_id AND v.show\_id \= votes.show\_id) \<= 10  
  )  
);

CREATE TABLE vote\_analytics (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  user\_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
  show\_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,  
  daily\_votes INTEGER DEFAULT 0,  
  show\_votes INTEGER DEFAULT 0,  
  last\_vote\_at TIMESTAMPTZ,  
  created\_at TIMESTAMPTZ DEFAULT NOW(),  
  updated\_at TIMESTAMPTZ DEFAULT NOW(),  
  CONSTRAINT unique\_user\_show\_analytics UNIQUE (user\_id, show\_id)  
);

CREATE TABLE sync\_history (  
  id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  sync\_type TEXT NOT NULL CHECK (sync\_type IN ('setlistfm', 'spotify', 'ticketmaster')),  
  entity\_type TEXT NOT NULL CHECK (entity\_type IN ('artist', 'show', 'song', 'setlist')),  
  entity\_id UUID,  
  external\_id TEXT,  
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),  
  error\_message TEXT,  
  items\_processed INTEGER DEFAULT 0,  
  started\_at TIMESTAMPTZ DEFAULT NOW(),  
  completed\_at TIMESTAMPTZ  
);

\-- Indexes for performance  
CREATE INDEX idx\_shows\_date\_status ON shows(date, status) WHERE status \= 'upcoming';  
CREATE INDEX idx\_shows\_artist\_date ON shows(artist\_id, date DESC);  
CREATE INDEX idx\_votes\_user\_created ON votes(user\_id, created\_at DESC);  
CREATE INDEX idx\_setlist\_songs\_votes ON setlist\_songs(vote\_count DESC);  
CREATE INDEX idx\_songs\_title\_trgm ON songs USING gin(title gin\_trgm\_ops);  
CREATE INDEX idx\_artists\_name\_trgm ON artists USING gin(name gin\_trgm\_ops);

\-- Materialized view for trending shows  
CREATE MATERIALIZED VIEW trending\_shows AS  
SELECT   
  s.id as show\_id,  
  s.artist\_id,  
  s.venue\_id,  
  s.date as show\_date,  
  s.title as show\_name,  
  s.status as show\_status,  
  s.view\_count,  
  COALESCE(vote\_stats.total\_votes, 0\) as total\_votes,  
  COALESCE(vote\_stats.unique\_voters, 0\) as unique\_voters,  
  COALESCE(vote\_stats.avg\_votes\_per\_song, 0\) as avg\_votes\_per\_song,  
  (  
    s.view\_count \* 0.3 \+   
    COALESCE(vote\_stats.total\_votes, 0\) \* 0.4 \+  
    COALESCE(vote\_stats.unique\_voters, 0\) \* 0.3  
  ) \*   
  CASE   
    WHEN s.date \<= CURRENT\_DATE \+ INTERVAL '7 days' THEN 2.0  
    WHEN s.date \<= CURRENT\_DATE \+ INTERVAL '30 days' THEN 1.5  
    WHEN s.date \<= CURRENT\_DATE \+ INTERVAL '90 days' THEN 1.0  
    ELSE 0.5  
  END as trending\_score  
FROM shows s  
LEFT JOIN LATERAL (  
  SELECT   
    COUNT(DISTINCT v.id) as total\_votes,  
    COUNT(DISTINCT v.user\_id) as unique\_voters,  
    AVG(ss.vote\_count) as avg\_votes\_per\_song  
  FROM votes v  
  JOIN setlist\_songs ss ON v.setlist\_song\_id \= ss.id  
  JOIN setlists sl ON ss.setlist\_id \= sl.id  
  WHERE sl.show\_id \= s.id  
) vote\_stats ON true  
WHERE s.date \>= CURRENT\_DATE  
AND s.status \!= 'cancelled';

CREATE UNIQUE INDEX idx\_trending\_shows\_id ON trending\_shows(show\_id);

\-- RLS Policies  
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;  
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;  
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;  
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;  
ALTER TABLE setlist\_songs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE users ENABLE ROW LEVEL SECURITY;  
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

\-- Public read access  
CREATE POLICY "Public read access" ON artists FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON venues FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON shows FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON setlists FOR SELECT USING (true);  
CREATE POLICY "Public read access" ON setlist\_songs FOR SELECT USING (true);

\-- User-specific policies  
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() \= id);  
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() \= id);  
CREATE POLICY "Users can insert own votes" ON votes FOR INSERT WITH CHECK (auth.uid() \= user\_id);  
CREATE POLICY "Users can read all votes" ON votes FOR SELECT USING (true);

## **3\. MONOREPO SETUP & CONFIGURATION**

────────────────────────────────────

### **Root Configuration Files:**

**package.json**:

{  
  "name": "setlist-score-show",  
  "private": true,  
  "workspaces": \[  
    "apps/\*",  
    "packages/\*"  
  \],  
  "scripts": {  
    "dev": "turbo dev",  
    "build": "turbo build",  
    "test": "turbo test",  
    "lint": "turbo lint",  
    "type-check": "turbo type-check",  
    "db:migrate": "pnpm \--filter @setlist/database migrate",  
    "db:push": "pnpm \--filter @setlist/database push",  
    "db:seed": "pnpm \--filter @setlist/database seed",  
    "sync:setlists": "pnpm \--filter @setlist/api sync:setlists"  
  },  
  "devDependencies": {  
    "turbo": "^2.0.0",  
    "@types/node": "^20.0.0",  
    "typescript": "^5.4.0"  
  },  
  "packageManager": "pnpm@9.0.0",  
  "engines": {  
    "node": "\>=20.0.0"  
  }  
}

**turbo.json**:

{  
  "$schema": "https://turbo.build/schema.json",  
  "globalDependencies": \["\*\*/.env.\*local"\],  
  "pipeline": {  
    "build": {  
      "dependsOn": \["^build"\],  
      "outputs": \[".next/\*\*", "dist/\*\*"\],  
      "env": \["NODE\_ENV", "NEXT\_PUBLIC\_\*", "DATABASE\_URL"\]  
    },  
    "dev": {  
      "cache": false,  
      "persistent": true  
    },  
    "lint": {},  
    "type-check": {},  
    "test": {  
      "dependsOn": \["build"\]  
    }  
  }  
}

## **4\. WEB APPLICATION (Next.js 14\)**

─────────────────────────────────

### **Project Structure:**

apps/web/  
├── app/  
│   ├── (auth)/  
│   │   ├── login/  
│   │   └── register/  
│   ├── (main)/  
│   │   ├── layout.tsx  
│   │   ├── page.tsx              \# Homepage  
│   │   ├── shows/  
│   │   │   ├── page.tsx          \# All shows  
│   │   │   └── \[id\]/  
│   │   │       ├── page.tsx      \# Show detail \+ voting  
│   │   │       └── loading.tsx  
│   │   └── artists/  
│   │       ├── page.tsx          \# All artists  
│   │       └── \[slug\]/  
│   │           └── page.tsx      \# Artist shows  
│   ├── api/  
│   │   └── trpc/  
│   │       └── \[trpc\]/  
│   │           └── route.ts      \# tRPC handler  
│   ├── layout.tsx                \# Root layout  
│   └── globals.css               \# Global styles with teal theme  
├── components/  
│   ├── ui/                       \# Shadcn components  
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
│   ├── useRealtimeVotes.ts      \# Supabase Realtime hook  
│   └── useAuth.ts  
├── lib/  
│   ├── trpc.ts  
│   ├── supabase.ts  
│   └── utils.ts  
└── styles/  
    └── theme.ts                  \# Teal gradient theme config

### **Key Component: VoteButton with Teal Theme**

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
  const { vote, isVoting } \= useVoting()  
  const \[showSuccess, setShowSuccess\] \= useState(false)

  const handleVote \= async () \=\> {  
    if (hasVoted || isVoting) return  
      
    const result \= await vote({ songId, showId })  
    if (result.success) {  
      setShowSuccess(true)  
      setTimeout(() \=\> setShowSuccess(false), 2000\)  
    }  
  }

  return (  
    \<motion.button  
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
    \>  
      \<AnimatePresence mode="wait"\>  
        {showSuccess ? (  
          \<motion.div  
            initial={{ scale: 0, rotate: \-180 }}  
            animate={{ scale: 1, rotate: 0 }}  
            exit={{ scale: 0, rotate: 180 }}  
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg"  
          \>  
            \<Check className="w-5 h-5 text-white" /\>  
          \</motion.div\>  
        ) : (  
          \<\>  
            \<ChevronUp className={cn(  
              "w-5 h-5 transition-transform",  
              hasVoted && "text-white"  
            )} /\>  
            \<span className="min-w-\[3ch\] text-center"\>{currentVotes}\</span\>  
            {\!hasVoted && \<span className="text-sm opacity-70"\>Vote\</span\>}  
          \</\>  
        )}  
      \</AnimatePresence\>  
    \</motion.button\>  
  )  
}

### **Theme Configuration:**

/\* app/globals.css \*/  
@tailwind base;  
@tailwind components;  
@tailwind utilities;

@layer base {  
  :root {  
    \--background: 0 0% 3.9%;  
    \--foreground: 0 0% 98%;  
      
    /\* Teal gradient theme colors \*/  
    \--primary: 173 80% 40%;  
    \--primary-foreground: 0 0% 98%;  
    \--accent: 172 66% 50%;  
    \--accent-foreground: 0 0% 9%;  
      
    /\* Gradient definitions \*/  
    \--gradient-primary: linear-gradient(135deg, \#14b8a6 0%, \#06b6d4 100%);  
    \--gradient-hover: linear-gradient(135deg, \#0f766e 0%, \#0891b2 100%);  
    \--gradient-active: linear-gradient(135deg, \#134e4a 0%, \#0c4a6e 100%);  
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

## **5\. API SERVICE (Fastify \+ GraphQL)**

────────────────────────────────────

### **Project Structure:**

apps/api/  
├── src/  
│   ├── index.ts                  \# Entry point  
│   ├── server.ts                 \# Fastify setup  
│   ├── schema/  
│   │   ├── index.ts             \# GraphQL schema  
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
│       └── supabase-realtime.ts  \# Supabase Realtime setup  
├── prisma/  
│   └── schema.prisma  
└── package.json

### **Core Server Setup with Supabase:**

// src/server.ts  
import Fastify from 'fastify'  
import mercurius from 'mercurius'  
import { PrismaClient } from '@setlist/database'  
import Redis from 'ioredis'  
import { createClient } from '@supabase/supabase-js'  
import { schema } from './schema'  
import { resolvers } from './resolvers'  
import { authPlugin } from './plugins/auth'  
import { rateLimitPlugin } from './plugins/ratelimit'  
import { supabaseRealtimePlugin } from './plugins/supabase-realtime'

export async function createServer() {  
  const app \= Fastify({  
    logger: {  
      level: process.env.LOG\_LEVEL || 'info',  
      transport: {  
        target: 'pino-pretty',  
        options: {  
          colorize: true  
        }  
      }  
    }  
  })

  // Database & Redis  
  const prisma \= new PrismaClient()  
  const redis \= new Redis(process.env.REDIS\_URL\!)  
    
  // Supabase client for server-side operations  
  const supabase \= createClient(  
    process.env.SUPABASE\_URL\!,  
    process.env.SUPABASE\_SERVICE\_ROLE\_KEY\! // Service role key for bypassing RLS  
  )

  app.decorate('prisma', prisma)  
  app.decorate('redis', redis)  
  app.decorate('supabase', supabase)

  // Plugins  
  await app.register(authPlugin)  
  await app.register(rateLimitPlugin)  
  await app.register(supabaseRealtimePlugin) // Sets up Realtime channels

  // GraphQL  
  await app.register(mercurius, {  
    schema,  
    resolvers,  
    context: async (request, reply) \=\> ({  
      prisma,  
      redis,  
      supabase,  
      user: request.user  
    }),  
    graphiql: process.env.NODE\_ENV \!== 'production'  
  })

  // Health check  
  app.get('/health', async () \=\> ({  
    status: 'ok',  
    timestamp: new Date().toISOString(),  
    uptime: process.uptime()  
  }))

  return app  
}

### **Voting Service with Supabase Realtime Integration:**

// src/services/voting.service.ts  
import { PrismaClient } from '@setlist/database'  
import Redis from 'ioredis'  
import { SupabaseClient } from '@supabase/supabase-js'  
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
    private redis: Redis,  
    private supabase: SupabaseClient  
  ) {}

  async castVote(input: VoteInput) {  
    const { userId, showId, songId, setlistSongId } \= input

    // Rate limiting check  
    const rateLimitKey \= \`ratelimit:vote:${userId}\`  
    const attempts \= await this.redis.incr(rateLimitKey)  
      
    if (attempts \=== 1\) {  
      await this.redis.expire(rateLimitKey, 60\) // 1 minute window  
    }  
      
    if (attempts \> 5\) {  
      throw new TRPCError({  
        code: 'TOO\_MANY\_REQUESTS',  
        message: 'Rate limit exceeded. Try again in a minute.'  
      })  
    }

    // Check vote limits  
    const \[dailyVotes, showVotes\] \= await Promise.all(\[  
      this.prisma.vote.count({  
        where: {  
          user\_id: userId,  
          created\_at: {  
            gte: new Date(new Date().setHours(0, 0, 0, 0))  
          }  
        }  
      }),  
      this.prisma.vote.count({  
        where: {  
          user\_id: userId,  
          show\_id: showId  
        }  
      })  
    \])

    if (dailyVotes \>= 50\) {  
      throw new TRPCError({  
        code: 'FORBIDDEN',  
        message: 'Daily vote limit reached (50 votes)'  
      })  
    }

    if (showVotes \>= 10\) {  
      throw new TRPCError({  
        code: 'FORBIDDEN',  
        message: 'Show vote limit reached (10 votes per show)'  
      })  
    }

    // Transaction for vote  
    const result \= await this.prisma.$transaction(async (tx) \=\> {  
      // Check if already voted  
      const existingVote \= await tx.vote.findUnique({  
        where: {  
          unique\_user\_song\_vote: {  
            user\_id: userId,  
            setlist\_song\_id: setlistSongId  
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
      const vote \= await tx.vote.create({  
        data: {  
          user\_id: userId,  
          setlist\_song\_id: setlistSongId,  
          show\_id: showId,  
          vote\_type: 'up'  
        }  
      })

      // Update vote count  
      const updatedSetlistSong \= await tx.setlistSong.update({  
        where: { id: setlistSongId },  
        data: {  
          vote\_count: {  
            increment: 1  
          }  
        },  
        include: {  
          song: true  
        }  
      })

      // Update analytics  
      await tx.voteAnalytics.upsert({  
        where: {  
          unique\_user\_show\_analytics: {  
            user\_id: userId,  
            show\_id: showId  
          }  
        },  
        create: {  
          user\_id: userId,  
          show\_id: showId,  
          daily\_votes: 1,  
          show\_votes: 1,  
          last\_vote\_at: new Date()  
        },  
        update: {  
          daily\_votes: {  
            increment: 1  
          },  
          show\_votes: {  
            increment: 1  
          },  
          last\_vote\_at: new Date()  
        }  
      })

      return { vote, updatedSetlistSong }  
    })

    // Invalidate cache  
    await this.redis.del(\`show:${showId}:songs\`)  
      
    // Broadcast update via Supabase Realtime  
    // Note: Since we're using database changes, Supabase automatically  
    // broadcasts the change to all subscribers. But we can also send  
    // custom messages for additional context:  
    await this.supabase.channel(\`show:${showId}\`)  
      .send({  
        type: 'broadcast',  
        event: 'vote\_update',  
        payload: {  
          setlistSongId,  
          songId,  
          newVoteCount: result.updatedSetlistSong.vote\_count,  
          songTitle: result.updatedSetlistSong.song.title,  
          voterId: userId  
        }  
      })

    return {  
      success: true,  
      voteId: result.vote.id,  
      dailyVotesRemaining: 50 \- dailyVotes \- 1,  
      showVotesRemaining: 10 \- showVotes \- 1,  
      newVoteCount: result.updatedSetlistSong.vote\_count  
    }  
  }  
}

## **6\. SYNC JOBS & EXTERNAL INTEGRATIONS**

───────────────────────────────────────

### **Setlist.fm Sync Job:**

// src/jobs/sync-setlists.ts  
import { PrismaClient } from '@setlist/database'  
import pLimit from 'p-limit'  
import { SetlistFmClient } from '../lib/setlistfm'  
import { SpotifyClient } from '../lib/spotify'

export class SetlistSyncJob {  
  private limit \= pLimit(3) // Max 3 concurrent API calls  
    
  constructor(  
    private prisma: PrismaClient,  
    private setlistFm: SetlistFmClient,  
    private spotify: SpotifyClient  
  ) {}

  async syncYesterdaysShows() {  
    const yesterday \= new Date()  
    yesterday.setDate(yesterday.getDate() \- 1\)  
      
    const dateStr \= yesterday.toISOString().split('T')\[0\]  
      
    console.log(\`Starting sync for ${dateStr}\`)  
      
    // Get all tracked artists  
    const artists \= await this.prisma.artist.findMany({  
      where: {  
        setlistfm\_mbid: { not: null }  
      }  
    })

    // Sync each artist's shows  
    const results \= await Promise.allSettled(  
      artists.map((artist) \=\>   
        this.limit(() \=\> this.syncArtistShows(artist, dateStr))  
      )  
    )

    // Log results  
    const successful \= results.filter(r \=\> r.status \=== 'fulfilled').length  
    const failed \= results.filter(r \=\> r.status \=== 'rejected').length  
      
    console.log(\`Sync complete: ${successful} successful, ${failed} failed\`)  
  }

  private async syncArtistShows(artist: any, date: string) {  
    try {  
      const setlists \= await this.setlistFm.getArtistSetlists(  
        artist.setlistfm\_mbid,  
        date  
      )

      for (const setlist of setlists) {  
        await this.prisma.$transaction(async (tx) \=\> {  
          // Upsert venue  
          const venue \= await tx.venue.upsert({  
            where: {  
              setlistfm\_id: setlist.venue.id  
            },  
            create: {  
              setlistfm\_id: setlist.venue.id,  
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
          const show \= await tx.show.create({  
            data: {  
              artist\_id: artist.id,  
              venue\_id: venue.id,  
              setlistfm\_id: setlist.id,  
              date: new Date(setlist.eventDate),  
              title: setlist.tour?.name || \`${artist.name} at ${venue.name}\`,  
              tour\_name: setlist.tour?.name,  
              status: 'completed'  
            }  
          })

          // Create setlist and songs  
          const mainSetlist \= await tx.setlist.create({  
            data: {  
              show\_id: show.id,  
              name: 'Main Set',  
              order\_index: 0  
            }  
          })

          // Process songs  
          let position \= 1  
          for (const set of setlist.sets.set) {  
            for (const song of set.song) {  
              // Try to match with existing song  
              let dbSong \= await tx.song.findFirst({  
                where: {  
                  artist\_id: artist.id,  
                  title: {  
                    equals: song.name,  
                    mode: 'insensitive'  
                  }  
                }  
              })

              // If not found, try Spotify search  
              if (\!dbSong && artist.spotify\_id) {  
                const spotifyTrack \= await this.spotify.searchTrack(  
                  song.name,  
                  artist.name  
                )  
                  
                if (spotifyTrack) {  
                  dbSong \= await tx.song.create({  
                    data: {  
                      artist\_id: artist.id,  
                      spotify\_id: spotifyTrack.id,  
                      title: spotifyTrack.name,  
                      album: spotifyTrack.album.name,  
                      album\_image\_url: spotifyTrack.album.images\[0\]?.url,  
                      duration\_ms: spotifyTrack.duration\_ms,  
                      popularity: spotifyTrack.popularity,  
                      preview\_url: spotifyTrack.preview\_url,  
                      spotify\_url: spotifyTrack.external\_urls.spotify  
                    }  
                  })  
                }  
              }

              // Create as unmatched song if still not found  
              if (\!dbSong) {  
                dbSong \= await tx.song.create({  
                  data: {  
                    artist\_id: artist.id,  
                    title: song.name,  
                    album: 'Unknown'  
                  }  
                })  
              }

              // Add to setlist  
              await tx.setlistSong.create({  
                data: {  
                  setlist\_id: mainSetlist.id,  
                  song\_id: dbSong.id,  
                  position: position++  
                }  
              })  
            }  
          }

          // Log sync  
          await tx.syncHistory.create({  
            data: {  
              sync\_type: 'setlistfm',  
              entity\_type: 'setlist',  
              entity\_id: show.id,  
              external\_id: setlist.id,  
              status: 'completed',  
              items\_processed: position \- 1  
            }  
          })  
        })  
      }  
    } catch (error) {  
      console.error(\`Failed to sync artist ${artist.name}:\`, error)  
        
      await this.prisma.syncHistory.create({  
        data: {  
          sync\_type: 'setlistfm',  
          entity\_type: 'artist',  
          entity\_id: artist.id,  
          status: 'failed',  
          error\_message: error.message  
        }  
      })  
        
      throw error  
    }  
  }  
}

## **7\. REAL-TIME UPDATES WITH SUPABASE REALTIME**

────────────────────────────────────────────

Let me explain how Supabase Realtime works differently from traditional WebSockets. With Supabase Realtime, you're essentially subscribing to database changes rather than managing your own WebSocket connections. This makes the implementation much simpler and more reliable.

### **Frontend Realtime Hook:**

// hooks/useRealtimeVotes.ts  
import { useEffect, useState } from 'react'  
import { supabase } from '@/lib/supabase'  
import { RealtimeChannel } from '@supabase/supabase-js'

interface VoteUpdate {  
  setlistSongId: string  
  songId: string  
  newVoteCount: number  
  songTitle: string  
  voterId: string  
}

export function useRealtimeVotes(showId: string) {  
  const \[channel, setChannel\] \= useState\<RealtimeChannel | null\>(null)  
  const \[latestUpdate, setLatestUpdate\] \= useState\<VoteUpdate | null\>(null)

  useEffect(() \=\> {  
    // Create a channel for this specific show  
    const showChannel \= supabase.channel(\`show:${showId}\`)  
      
    // Listen to database changes on setlist\_songs table  
    showChannel  
      .on(  
        'postgres\_changes',  
        {  
          event: 'UPDATE',  
          schema: 'public',  
          table: 'setlist\_songs',  
          filter: \`setlist\_id=in.(SELECT id FROM setlists WHERE show\_id=eq.${showId})\`  
        },  
        (payload) \=\> {  
          // When someone votes, the vote\_count updates and we receive it here  
          console.log('Vote update received:', payload)  
          setLatestUpdate({  
            setlistSongId: payload.new.id,  
            songId: payload.new.song\_id,  
            newVoteCount: payload.new.vote\_count,  
            songTitle: '', // We'd need to fetch this separately or include in payload  
            voterId: '' // Anonymous for privacy  
          })  
        }  
      )  
      // Also listen to custom broadcasts for richer updates  
      .on('broadcast', { event: 'vote\_update' }, (payload) \=\> {  
        console.log('Custom vote update:', payload)  
        setLatestUpdate(payload.payload as VoteUpdate)  
      })  
      .subscribe((status) \=\> {  
        if (status \=== 'SUBSCRIBED') {  
          console.log(\`Listening to show ${showId} updates\`)  
        }  
      })  
      
    setChannel(showChannel)  
      
    // Cleanup function  
    return () \=\> {  
      if (showChannel) {  
        supabase.removeChannel(showChannel)  
      }  
    }  
  }, \[showId\])

  return { latestUpdate, channel }  
}

### **Show Voting Page with Realtime Updates:**

// app/(main)/shows/\[id\]/page.tsx  
'use client'

import { useEffect, useState } from 'react'  
import { useQuery, useQueryClient } from '@tanstack/react-query'  
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'  
import { VoteButton } from '@/components/voting/VoteButton'  
import { motion, AnimatePresence } from 'framer-motion'  
import { supabase } from '@/lib/supabase'

export default function ShowPage({ params }: { params: { id: string } }) {  
  const queryClient \= useQueryClient()  
  const { latestUpdate } \= useRealtimeVotes(params.id)  
  const \[votedSongs, setVotedSongs\] \= useState\<Set\<string\>\>(new Set())

  // Fetch show data with songs  
  const { data: show, isLoading } \= useQuery({  
    queryKey: \['show', params.id\],  
    queryFn: async () \=\> {  
      const { data, error } \= await supabase  
        .from('shows')  
        .select(\`  
          \*,  
          artist:artists(\*),  
          venue:venues(\*),  
          setlists(  
            \*,  
            setlist\_songs(  
              \*,  
              song:songs(\*)  
            )  
          )  
        \`)  
        .eq('id', params.id)  
        .single()  
        
      if (error) throw error  
      return data  
    }  
  })

  // Update local state when realtime update comes in  
  useEffect(() \=\> {  
    if (latestUpdate) {  
      // Update the query cache with new vote count  
      queryClient.setQueryData(\['show', params.id\], (oldData: any) \=\> {  
        if (\!oldData) return oldData  
          
        return {  
          ...oldData,  
          setlists: oldData.setlists.map((setlist: any) \=\> ({  
            ...setlist,  
            setlist\_songs: setlist.setlist\_songs.map((ss: any) \=\>   
              ss.id \=== latestUpdate.setlistSongId  
                ? { ...ss, vote\_count: latestUpdate.newVoteCount }  
                : ss  
            )  
          }))  
        }  
      })  
        
      // Show a toast or animation for the update  
      showVoteAnimation(latestUpdate)  
    }  
  }, \[latestUpdate, queryClient, params.id\])

  if (isLoading) return \<ShowPageSkeleton /\>

  return (  
    \<div className="container mx-auto px-4 py-8"\>  
      {/\* Show header with gradient \*/}  
      \<div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-white"\>  
        \<h1 className="text-4xl font-bold mb-2"\>{show.artist.name}\</h1\>  
        \<p className="text-xl opacity-90"\>{show.venue.name}\</p\>  
        \<p className="opacity-80"\>  
          {new Date(show.date).toLocaleDateString('en-US', {  
            weekday: 'long',  
            year: 'numeric',  
            month: 'long',  
            day: 'numeric'  
          })}  
        \</p\>  
      \</div\>

      {/\* Voting section \*/}  
      \<div className="space-y-6"\>  
        \<div className="flex items-center justify-between mb-4"\>  
          \<h2 className="text-2xl font-semibold"\>Vote for Songs\</h2\>  
          \<div className="text-sm text-gray-500"\>  
            {votedSongs.size}/10 votes used  
          \</div\>  
        \</div\>

        \<AnimatePresence\>  
          {show.setlists\[0\]?.setlist\_songs  
            .sort((a, b) \=\> b.vote\_count \- a.vote\_count)  
            .map((setlistSong, index) \=\> (  
              \<motion.div  
                key={setlistSong.id}  
                layout  
                initial={{ opacity: 0, y: 20 }}  
                animate={{ opacity: 1, y: 0 }}  
                exit={{ opacity: 0, y: \-20 }}  
                transition={{ duration: 0.3, delay: index \* 0.05 }}  
                className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"  
              \>  
                \<div className="flex items-center gap-4"\>  
                  \<span className="text-2xl font-bold text-gray-600"\>  
                    \#{index \+ 1}  
                  \</span\>  
                  \<div\>  
                    \<h3 className="font-semibold text-lg"\>  
                      {setlistSong.song.title}  
                    \</h3\>  
                    \<p className="text-sm text-gray-400"\>  
                      {setlistSong.song.album}  
                    \</p\>  
                  \</div\>  
                \</div\>  
                  
                \<VoteButton  
                  songId={setlistSong.song.id}  
                  showId={params.id}  
                  currentVotes={setlistSong.vote\_count}  
                  hasVoted={votedSongs.has(setlistSong.id)}  
                  position={index \+ 1}  
                /\>  
              \</motion.div\>  
            ))}  
        \</AnimatePresence\>  
      \</div\>

      {/\* Live activity indicator \*/}  
      \<LiveActivityIndicator showId={params.id} /\>  
    \</div\>  
  )  
}

// Component to show live voting activity  
function LiveActivityIndicator({ showId }: { showId: string }) {  
  const \[activeUsers, setActiveUsers\] \= useState(0)  
    
  useEffect(() \=\> {  
    const channel \= supabase.channel(\`show:${showId}:presence\`)  
      
    channel  
      .on('presence', { event: 'sync' }, () \=\> {  
        const state \= channel.presenceState()  
        setActiveUsers(Object.keys(state).length)  
      })  
      .subscribe(async (status) \=\> {  
        if (status \=== 'SUBSCRIBED') {  
          await channel.track({ online\_at: new Date().toISOString() })  
        }  
      })  
      
    return () \=\> {  
      supabase.removeChannel(channel)  
    }  
  }, \[showId\])

  return (  
    \<div className="fixed bottom-4 right-4 bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2"\>  
      \<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /\>  
      \<span className="text-sm"\>  
        {activeUsers} {activeUsers \=== 1 ? 'person' : 'people'} voting now  
      \</span\>  
    \</div\>  
  )  
}

### **Supabase Realtime Plugin for API:**

// src/plugins/supabase-realtime.ts  
import fp from 'fastify-plugin'  
import { createClient } from '@supabase/supabase-js'

export const supabaseRealtimePlugin \= fp(async (app) \=\> {  
  // Initialize Supabase admin client for server-side broadcasts  
  const supabaseAdmin \= createClient(  
    process.env.SUPABASE\_URL\!,  
    process.env.SUPABASE\_SERVICE\_ROLE\_KEY\!,  
    {  
      auth: {  
        autoRefreshToken: false,  
        persistSession: false  
      }  
    }  
  )

  app.decorate('broadcast', async (channel: string, event: any) \=\> {  
    // Broadcast custom events to Supabase Realtime channels  
    const { error } \= await supabaseAdmin  
      .channel(channel)  
      .send({  
        type: 'broadcast',  
        event: event.type,  
        payload: event.payload  
      })  
      
    if (error) {  
      app.log.error('Failed to broadcast event:', error)  
    }  
  })

  // Helper to track metrics in realtime  
  app.decorate('trackRealtimeMetric', async (metric: string, value: number) \=\> {  
    await supabaseAdmin  
      .channel('metrics')  
      .send({  
        type: 'broadcast',  
        event: 'metric\_update',  
        payload: {  
          metric,  
          value,  
          timestamp: new Date().toISOString()  
        }  
      })  
  })

  app.log.info('Supabase Realtime plugin loaded')  
})

### **GraphQL Subscription Alternative Using Supabase:**

Instead of traditional GraphQL subscriptions, we can leverage Supabase Realtime directly in the frontend. However, if you still want GraphQL subscriptions, here's how to bridge them:

// src/resolvers/subscription.resolver.ts  
import { withFilter } from 'mercurius'  
import { supabase } from '../lib/supabase'

export const subscriptionResolvers \= {  
  Subscription: {  
    showUpdated: {  
      subscribe: withFilter(  
        (root, args, { app }) \=\> {  
          // Create an async iterator from Supabase Realtime  
          return (async function\* () {  
            const channel \= supabase.channel(\`show:${args.showId}\`)  
              
            const updates: any\[\] \= \[\]  
            let resolver: () \=\> void  
              
            channel  
              .on('postgres\_changes',   
                {   
                  event: '\*',   
                  schema: 'public',   
                  table: 'setlist\_songs'   
                },  
                (payload) \=\> {  
                  updates.push({  
                    showUpdated: {  
                      showId: args.showId,  
                      type: 'VOTE\_UPDATE',  
                      data: payload  
                    }  
                  })  
                  if (resolver) resolver()  
                }  
              )  
              .subscribe()  
              
            while (true) {  
              if (updates.length \> 0\) {  
                yield updates.shift()  
              } else {  
                await new Promise(resolve \=\> { resolver \= resolve })  
              }  
            }  
          })()  
        },  
        (payload, variables) \=\> {  
          return payload.showUpdated.showId \=== variables.showId  
        }  
      )  
    }  
  }  
}

## **8\. DEPLOYMENT & INFRASTRUCTURE**

─────────────────────────────────

### **Docker Compose for Development:**

\# docker-compose.yml  
version: '3.8'

services:  
  postgres:  
    image: postgres:15-alpine  
    environment:  
      POSTGRES\_USER: postgres  
      POSTGRES\_PASSWORD: postgres  
      POSTGRES\_DB: setlist\_score\_show  
    ports:  
      \- '5432:5432'  
    volumes:  
      \- postgres\_data:/var/lib/postgresql/data

  redis:  
    image: redis:7-alpine  
    command: redis-server \--appendonly yes  
    ports:  
      \- '6379:6379'  
    volumes:  
      \- redis\_data:/data

  api:  
    build:  
      context: .  
      dockerfile: ./infra/docker/api.Dockerfile  
    environment:  
      DATABASE\_URL: postgresql://postgres:postgres@postgres:5432/setlist\_score\_show  
      REDIS\_URL: redis://redis:6379  
      SUPABASE\_URL: ${SUPABASE\_URL}  
      SUPABASE\_ANON\_KEY: ${SUPABASE\_ANON\_KEY}  
      SUPABASE\_SERVICE\_ROLE\_KEY: ${SUPABASE\_SERVICE\_ROLE\_KEY}  
    ports:  
      \- '4000:4000'  
    depends\_on:  
      \- postgres  
      \- redis  
    volumes:  
      \- ./apps/api:/app/apps/api  
      \- ./packages:/app/packages

volumes:  
  postgres\_data:  
  redis\_data:

### **GitHub Actions for CI/CD:**

\# .github/workflows/ci.yml  
name: CI/CD Pipeline

on:  
  push:  
    branches: \[main, develop\]  
  pull\_request:  
    branches: \[main\]

jobs:  
  test:  
    runs-on: ubuntu-latest  
      
    services:  
      postgres:  
        image: postgres:15  
        env:  
          POSTGRES\_PASSWORD: postgres  
        options: \>-  
          \--health-cmd pg\_isready  
          \--health-interval 10s  
          \--health-timeout 5s  
          \--health-retries 5  
        ports:  
          \- 5432:5432  
        
      redis:  
        image: redis:7  
        options: \>-  
          \--health-cmd "redis-cli ping"  
          \--health-interval 10s  
          \--health-timeout 5s  
          \--health-retries 5  
        ports:  
          \- 6379:6379  
      
    steps:  
      \- uses: actions/checkout@v4  
        
      \- uses: pnpm/action-setup@v2  
        with:  
          version: 9  
        
      \- uses: actions/setup-node@v4  
        with:  
          node-version: 20  
          cache: 'pnpm'  
        
      \- run: pnpm install \--frozen-lockfile  
        
      \- name: Run type checks  
        run: pnpm type-check  
        
      \- name: Run linting  
        run: pnpm lint  
        
      \- name: Run tests  
        run: pnpm test  
        env:  
          DATABASE\_URL: postgresql://postgres:postgres@localhost:5432/test  
          REDIS\_URL: redis://localhost:6379

  deploy-web:  
    needs: test  
    if: github.ref \== 'refs/heads/main'  
    runs-on: ubuntu-latest  
      
    steps:  
      \- uses: actions/checkout@v4  
        
      \- name: Deploy to Vercel  
        run: |  
          pnpm dlx vercel \--prod \--token=${{ secrets.VERCEL\_TOKEN }}  
        env:  
          VERCEL\_ORG\_ID: ${{ secrets.VERCEL\_ORG\_ID }}  
          VERCEL\_PROJECT\_ID: ${{ secrets.VERCEL\_PROJECT\_ID }}

  deploy-api:  
    needs: test  
    if: github.ref \== 'refs/heads/main'  
    runs-on: ubuntu-latest  
      
    steps:  
      \- uses: actions/checkout@v4  
        
      \- name: Deploy to Railway  
        run: |  
          pnpm dlx @railway/cli@latest up \--service api  
        env:  
          RAILWAY\_TOKEN: ${{ secrets.RAILWAY\_TOKEN }}

### **Cron Job for Daily Sync:**

\# .github/workflows/daily-sync.yml  
name: Daily Setlist Sync

on:  
  schedule:  
    \- cron: '0 2 \* \* \*' \# 2 AM UTC daily  
  workflow\_dispatch:

jobs:  
  sync:  
    runs-on: ubuntu-latest  
      
    steps:  
      \- uses: actions/checkout@v4  
        
      \- uses: pnpm/action-setup@v2  
        with:  
          version: 9  
        
      \- uses: actions/setup-node@v4  
        with:  
          node-version: 20  
          cache: 'pnpm'  
        
      \- run: pnpm install \--frozen-lockfile  
        
      \- name: Run setlist sync  
        run: pnpm \--filter @setlist/api sync:setlists  
        env:  
          DATABASE\_URL: ${{ secrets.DATABASE\_URL }}  
          REDIS\_URL: ${{ secrets.REDIS\_URL }}  
          SETLIST\_FM\_API\_KEY: ${{ secrets.SETLIST\_FM\_API\_KEY }}  
          SPOTIFY\_CLIENT\_ID: ${{ secrets.SPOTIFY\_CLIENT\_ID }}  
          SPOTIFY\_CLIENT\_SECRET: ${{ secrets.SPOTIFY\_CLIENT\_SECRET }}  
          SUPABASE\_URL: ${{ secrets.SUPABASE\_URL }}  
          SUPABASE\_SERVICE\_ROLE\_KEY: ${{ secrets.SUPABASE\_SERVICE\_ROLE\_KEY }}  
        
      \- name: Calculate trending scores  
        run: pnpm \--filter @setlist/api calculate:trending  
        env:  
          DATABASE\_URL: ${{ secrets.DATABASE\_URL }}

## **9\. MIGRATION PLAN**

───────────────────

### **Phase 1: Database Migration**

1. Backup existing Supabase database  
2. Create migration scripts to transform schema  
3. Test migrations on staging environment  
4. Run migrations with zero downtime approach  
5. Verify data integrity

### **Phase 2: Monorepo Setup** 

1. Initialize Turborepo structure  
2. Move existing React code to `apps/web-legacy`  
3. Create new Next.js app in `apps/web`  
4. Setup Fastify API in `apps/api`  
5. Configure shared packages

### **Phase 3: Feature Parity** 

1. Implement authentication flow with Supabase Auth  
2. Port voting functionality with Supabase Realtime  
3. Add real-time updates using Supabase channels  
4. Implement show listing/search  
5. Add artist pages

### **Phase 4: New Features**

1. Implement external API syncs  
2. Add trending calculations  
3. Create admin dashboard  
4. Add analytics tracking  
5. Implement notification system using Supabase Realtime

### **Phase 5: Testing & Launch**

1. Comprehensive testing  
2. Performance optimization  
3. Security audit  
4. Gradual rollout  
5. Monitor and iterate






This comprehensive plan transforms your setlist voting app into a modern, scalable system leveraging Supabase Realtime instead of custom WebSocket infrastructure. The integration with Supabase provides built-in scaling, reliability, and simpler code maintenance while maintaining the real-time, interactive experience users expect.

