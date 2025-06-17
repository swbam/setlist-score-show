# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TheSet is a crowdsourced concert setlist voting platform built as a Turborepo monorepo with Next.js frontend and Supabase backend. The app features real-time voting, comprehensive data sync from external APIs (Spotify, Ticketmaster, Setlist.fm), and admin controls for data management.

## Common Commands

### Development
```bash
# Start all development servers (web at :3000)
pnpm dev

# Build all packages and apps
pnpm build

# Run tests across all packages
pnpm test

# Lint and type check
pnpm lint
pnpm type-check

# Run E2E tests with Playwright
pnpm playwright test
```

### Database Operations
```bash
# Run migrations (development)
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:deploy

# Push schema changes (development only)  
pnpm db:push

# Seed database with test data
pnpm db:seed
```

### Sync System & Data Population
```bash
# Test backend sync system functionality
pnpm backend:test

# Manual data population (recommended for initial setup)
pnpm manual-sync

# Sync only trending calculations
pnpm sync:trending

# Orchestrate all sync functions in sequence
pnpm manual-sync:orchestrator

# Legacy individual sync commands
pnpm sync:setlists
pnpm refresh:trending
pnpm jobs:sync
```

### App-Specific Commands

**Web App** (apps/web/):
```bash
# Run only web dev server
cd apps/web && pnpm dev

# Build Next.js app
cd apps/web && pnpm build

# Start production server
cd apps/web && pnpm start

# Run web-specific tests
cd apps/web && pnpm test
```

**API** (apps/api/):
```bash
# Run only API server with watch mode
cd apps/api && pnpm dev

# Build API with TypeScript compilation
cd apps/api && pnpm build

# Start production API server
cd apps/api && pnpm start

# Run API tests
cd apps/api && pnpm test

# Run individual background jobs
cd apps/api && pnpm sync:setlists
cd apps/api && pnpm sync:spotify
cd apps/api && pnpm calculate:trending
```

## Architecture & Key Patterns

### Monorepo Structure
- `apps/web/` - Next.js 14 app with App Router, uses React Query for data fetching
- `apps/api/` - Fastify server with GraphQL (Mercurius), Prisma ORM
- `packages/database/` - Shared Prisma schema and migrations
- `packages/ui/` - Shared React components
- `packages/types/` - Shared TypeScript types
- `supabase/` - Edge functions and database migrations

### Data Flow
1. **Frontend** → GraphQL queries/mutations → **API Server**
2. **API Server** → Prisma ORM → **PostgreSQL (Supabase)**
3. **Real-time updates** via Supabase Realtime subscriptions
4. **External data** synced via background jobs (Spotify, Setlist.fm, Ticketmaster)

### Key Services & Patterns

**Authentication**: Supabase Auth with JWT tokens
- Auth context in `apps/web/app/providers.tsx`
- Protected routes use middleware

**Real-time Voting**: 
- Supabase Realtime for live vote updates
- Vote validation and limits enforced server-side
- Hooks: `useRealtimeVotes`, `useVoteTracking`

**Data Synchronization**:
- Background jobs in `apps/api/src/jobs/`
- Rate-limited external API calls with Redis caching
- Sync services in `apps/api/src/services/`

**GraphQL Schema**:
- Schema files in `apps/api/src/schema/`
- Resolvers in `apps/api/src/resolvers/`
- Uses DataLoader for N+1 query optimization

### Testing Strategy
- **Unit tests**: Jest for both web and API
  - Web tests: `**/__tests__/**/*.test.ts[x]` using jsdom environment
  - API tests: `**/__tests__/**/*.test.ts` using Node environment
- **E2E tests**: Playwright configured to run at http://localhost:8080
  - Test files in `e2e/` and `__tests__/e2e/` directories
  - Runs on Chromium with retries on CI
- **Test database**: Uses separate test database for isolation
- **Coverage requirements**: 80% minimum for API (branches, functions, lines, statements)
- **Test commands**:
  ```bash
  # Run all tests
  pnpm test
  
  # Run tests for specific app
  cd apps/api && pnpm test
  cd apps/web && pnpm test
  
  # Run E2E tests
  pnpm playwright test
  ```

### Environment Configuration
Essential environment variables:
- `DATABASE_URL` - PostgreSQL connection
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Supabase config
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` - Spotify API
- `SETLIST_FM_API_KEY` - Setlist.fm API
- `REDIS_URL` - Redis connection

### Performance Considerations
- Database has indexes on frequently queried fields
- Redis caching for external API responses
- Materialized views for trending shows calculation
- React Query for client-side caching
- Image optimization via Next.js

### Deployment
- **Frontend**: Vercel (automatic deploys from main)
- **API**: Railway with Docker
- **Database**: Supabase managed PostgreSQL
- **Background Jobs**: Supabase Edge Functions as cron jobs

## Code Style & Development Guidelines

### React/TypeScript Patterns
- Use **early returns** whenever possible for better readability
- Always use **Tailwind classes** for styling; avoid CSS-in-JS or style tags
- Use **descriptive variable and function names**
- Event handlers should be prefixed with "handle" (e.g., `handleClick`, `handleKeyDown`)
- Use **const declarations** for functions: `const toggle = () => {}`
- **Define TypeScript types** wherever possible for better type safety

### Accessibility Requirements
- Implement proper accessibility features on interactive elements
- Use `tabindex="0"`, `aria-label`, `onClick`, and `onKeyDown` attributes appropriately
- Ensure keyboard navigation works for all interactive components

### Component Patterns
- Follow existing component patterns in `apps/web/components/`
- Use Radix UI primitives with custom styling via Tailwind
- Implement proper loading states and error boundaries
- Use React Query for data fetching with appropriate cache strategies

### API Development
- Follow GraphQL schema-first approach with `.graphql` files in `apps/api/src/schema/`
- Use Prisma for all database operations
- Implement proper error handling and validation with Zod
- Rate limit external API calls and cache responses with Redis
- Use proper logging with Pino logger

### File Organization
- Keep related files together (components, hooks, services)
- Use barrel exports (`index.ts`) for clean imports
- Follow monorepo workspace patterns with `@setlist/*` scoped packages
- Place shared types in `packages/types/src/`

### IMPORTANT FIXES NEEDED AND DETAILED PLAN:

You're right! Let me review the existing database schema more carefully:

# Complete Implementation & Fix Outline for TheSet (Revised)
*After thorough review of existing database schema*

## 🔍 Database Review - What Already Exists

### ✅ Tables Already Present:
- `Artist` - Complete with Spotify integration
- `Venue` - With location data
- `Show` - With status, dates, relationships
- `Song` - Artist songs from Spotify
- `Setlist` - For each show
- `SetlistSong` - Songs in setlists with vote counts
- `User` - User accounts
- `Vote` - User votes on setlist songs
- `VoteAnalytics` - Tracking voting patterns
- `SpotifyArtist`, `SpotifyTopArtist` - User's Spotify data
- `SyncHistory` - Tracking sync operations

### ❌ Tables Still Missing:
- `PlayedSetlist` - For actual performed setlists (after show)
- `PlayedSetlistSong` - Songs actually performed
- User `role` field - Currently no role system

### ⚠️ No Need for UserArtist Table
The relationship is already handled via `SpotifyTopArtist` table!

---

## 📋 Revised Complete Implementation Plan

### Phase 1: Database Fixes (Day 1 Morning)

#### 1.1 Add Only Missing Tables
````prisma
model PlayedSetlist {
  id          String   @id @default(cuid())
  showId      String   @unique
  show        Show     @relation(fields: [showId], references: [id])
  setlistfmId String?  @unique
  importedAt  DateTime @default(now())
  songs       PlayedSetlistSong[]
  
  @@index([showId])
  @@index([setlistfmId])
}

model PlayedSetlistSong {
  id              String        @id @default(cuid())
  playedSetlistId String
  playedSetlist   PlayedSetlist @relation(fields: [playedSetlistId], references: [id])
  songId          String?
  song            Song?         @relation(fields: [songId], references: [id])
  songName        String        // For unmatched songs
  position        Int
  isEncore        Boolean       @default(false)
  
  @@unique([playedSetlistId, position])
  @@index([songId])
}

// Update User model to add role
model User {
  // ...existing fields...
  role String @default("user") // "user" | "admin"
}
````

#### 1.2 Fix Homepage Data Query
The issue: `getTopHomepageContent()` queries a non-existent view. Create proper view:

````sql
CREATE OR REPLACE VIEW public.homepage_shows AS
SELECT 
  s.id,
  s.name,
  s.date,
  s.image_url,
  s.ticketmaster_id,
  s.status,
  s.created_at,
  a.id as artist_id,
  a.name as artist_name,
  a.spotify_id,
  a.images as artist_images,
  a.genres,
  a.popularity,
  v.id as venue_id,
  v.name as venue_name,
  v.city,
  v.state,
  v.country,
  COALESCE(vote_counts.total_votes, 0) as total_votes
FROM shows s
INNER JOIN artists a ON s.artist_id = a.id
INNER JOIN venues v ON s.venue_id = v.id
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT vo.id) as total_votes
  FROM setlists sl
  JOIN setlist_songs ss ON sl.id = ss.setlist_id
  JOIN votes vo ON ss.id = vo.setlist_song_id
  WHERE sl.show_id = s.id
) vote_counts ON true
WHERE 
  s.date >= CURRENT_DATE
  AND s.status = 'upcoming'
  AND v.country IN ('United States', 'US', 'USA')
  AND a.popularity > 40;

-- Top artists view
CREATE OR REPLACE VIEW public.homepage_artists AS
SELECT DISTINCT ON (a.id)
  a.id,
  a.name,
  a.spotify_id,
  a.images,
  a.genres,
  a.popularity,
  COUNT(DISTINCT s.id) as upcoming_shows
FROM artists a
INNER JOIN shows s ON s.artist_id = a.id
INNER JOIN venues v ON s.venue_id = v.id
WHERE 
  s.date >= CURRENT_DATE
  AND s.status = 'upcoming'
  AND v.country IN ('United States', 'US', 'USA')
  AND a.popularity > 50
GROUP BY a.id
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY a.id, a.popularity DESC;

-- RPC for combined homepage content
CREATE OR REPLACE FUNCTION get_homepage_content(
  show_limit INT DEFAULT 24,
  artist_limit INT DEFAULT 12
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'shows', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT * FROM homepage_shows
        ORDER BY 
          date ASC,
          popularity DESC
        LIMIT show_limit
      ) s
    ),
    'artists', (
      SELECT json_agg(row_to_json(a))
      FROM (
        SELECT * FROM homepage_artists
        ORDER BY 
          upcoming_shows DESC,
          popularity DESC
        LIMIT artist_limit
      ) a
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
````

### Phase 2: Fix Core Functionality (Day 1 Afternoon)

#### 2.1 Fix Homepage Data Loading
````typescript
export async function getTopHomepageContent() {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .rpc('get_homepage_content', {
      show_limit: 24,
      artist_limit: 12
    });

  if (error) {
    console.error('Error fetching homepage content:', error);
    return { shows: [], artists: [] };
  }

  return data || { shows: [], artists: [] };
}
````

#### 2.2 Add Automatic Setlist Creation
````typescript
async function createInitialSetlist(showId: string, artistId: string) {
  // Get artist's top songs
  const songs = await prisma.song.findMany({
    where: { 
      artistId,
      popularity: { gte: 50 } // Popular songs
    },
    orderBy: { popularity: 'desc' },
    take: 20
  });

  if (songs.length < 5) {
    // If not enough popular songs, get any songs
    const moreSongs = await prisma.song.findMany({
      where: { artistId },
      orderBy: { popularity: 'desc' },
      take: 20
    });
    songs.push(...moreSongs);
  }

  // Select varied songs (mix of popular and deep cuts)
  const selectedSongs = selectVariedSongs(songs, 15);

  // Create setlist
  const setlist = await prisma.setlist.create({
    data: {
      showId,
      name: 'Main Set',
      setlistSongs: {
        create: selectedSongs.map((song, index) => ({
          songId: song.id,
          position: index + 1,
          voteCount: 0
        }))
      }
    }
  });

  return setlist;
}

function selectVariedSongs(songs: Song[], count: number): Song[] {
  if (songs.length <= count) return songs;
  
  const popular = songs.slice(0, Math.ceil(count * 0.6));
  const deepCuts = songs.slice(Math.ceil(count * 0.6));
  
  // Shuffle deep cuts
  const shuffled = deepCuts.sort(() => Math.random() - 0.5);
  
  return [...popular, ...shuffled.slice(0, count - popular.length)];
}
````

### Phase 3: API Routes for Admin (Day 2 Morning)

#### 3.1 Create Admin API Routes
````typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

const ALLOWED_JOBS = [
  'sync-homepage-orchestrator',
  'sync-trending-shows', 
  'sync-ticketmaster-shows',
  'sync-spotify-catalog',
  'refresh-trending-shows',
  'sync-setlists'
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: { job: string } }
) {
  // Check admin role
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate job name
  if (!ALLOWED_JOBS.includes(params.job as any)) {
    return NextResponse.json({ error: 'Invalid job' }, { status: 400 });
  }

  // Create service role client
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await serviceSupabase.functions.invoke(params.job, {
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`
      }
    });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      job: params.job,
      data 
    });
  } catch (error) {
    console.error(`Failed to trigger ${params.job}:`, error);
    return NextResponse.json({ 
      error: `Failed to trigger job: ${error.message}` 
    }, { status: 500 });
  }
}
````

### Phase 4: Enhanced Homepage Design (Day 2 Afternoon)

#### 4.1 Revamped Homepage Component
````tsx
import { Suspense } from 'react';
import { getTopHomepageContent } from '@/lib/supabase/queries/getTopHomepageContent';
import { ArtistCard } from '@/components/cards/ArtistCard';
import { ShowCard } from '@/components/cards/ShowCard';
import { UnifiedSearch } from '@/components/UnifiedSearch';
import { HeroSection } from '@/components/homepage/HeroSection';
import { LoadingGrid } from '@/components/LoadingGrid';

export default async function HomePage() {
  const { shows, artists } = await getTopHomepageContent();

  // Group shows by date
  const groupedShows = shows.reduce((acc, show) => {
    const date = new Date(show.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(show);
    return acc;
  }, {} as Record<string, typeof shows>);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <HeroSection />

      {/* Search Bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <UnifiedSearch />
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Trending Artists */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Trending Artists
            </h2>
            <p className="text-sm text-gray-400">
              Vote on upcoming shows
            </p>
          </div>
          
          <Suspense fallback={<LoadingGrid count={6} />}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {artists.slice(0, 12).map((artist) => (
                <ArtistCard 
                  key={artist.id} 
                  artist={artist}
                  showCount={artist.upcoming_shows}
                />
              ))}
            </div>
          </Suspense>
        </section>

        {/* Upcoming Shows by Date */}
        {Object.entries(groupedShows).slice(0, 5).map(([date, dateShows]) => (
          <section key={date}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white">
                {date}
              </h2>
              <span className="text-sm text-gray-400">
                {dateShows.length} shows
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dateShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
````

#### 4.2 Apple-Tier Card Components
````tsx
export function ShowCard({ show }: { show: HomepageShow }) {
  return (
    <Link 
      href={`/shows/${show.id}`}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={show.artist_images?.[0]?.url || '/placeholder-artist.jpg'}
          alt={show.artist_name}
          fill
          className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Date Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium">
          <Calendar className="w-3 h-3" />
          {new Date(show.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </div>

        {/* Artist & Show Info */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">
            {show.artist_name}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-1">
            {show.name}
          </p>
        </div>

        {/* Venue Info */}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="line-clamp-1">
            {show.venue_name}, {show.city}
          </span>
        </div>

        {/* Vote Count */}
        {show.total_votes > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs text-gray-400">
              {show.total_votes} votes
            </span>
            <div className="flex -space-x-1">
              {[...Array(Math.min(3, Math.floor(show.total_votes / 10)))].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
}
````

### Phase 5: Complete Admin Panel (Day 3 Morning)

#### 5.1 Enhanced Admin Panel
````tsx
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  RefreshCw, 
  Music, 
  Calendar, 
  TrendingUp, 
  Database,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

const SYNC_JOBS = [
  {
    id: 'sync-homepage-orchestrator',
    name: 'Full Homepage Sync',
    description: 'Sync all artists, shows, and venues',
    icon: Database,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'sync-ticketmaster-shows',
    name: 'Ticketmaster Shows',
    description: 'Import upcoming shows from Ticketmaster',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'sync-spotify-catalog',
    name: 'Spotify Catalogs',
    description: 'Update artist song catalogs',
    icon: Music,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'refresh-trending-shows',
    name: 'Calculate Trending',
    description: 'Update trending shows and artists',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'sync-setlists',
    name: 'Import Setlists',
    description: 'Import actual performed setlists',
    icon: RefreshCw,
    color: 'from-indigo-500 to-purple-500'
  }
];

export function AdminPanel() {
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({});

  const triggerSync = async (jobId: string) => {
    setRunning(prev => ({ ...prev, [jobId]: true }));
    setResults(prev => ({ ...prev, [jobId]: undefined }));

    try {
      const response = await fetch(`/api/admin/trigger/${jobId}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger sync');
      }

      setResults(prev => ({ ...prev, [jobId]: 'success' }));
      toast({
        title: 'Sync Started',
        description: `${jobId} has been triggered successfully`,
      });
    } catch (error) {
      setResults(prev => ({ ...prev, [jobId]: 'error' }));
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRunning(prev => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-white/10">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Admin Controls</h3>
          <p className="text-sm text-gray-400">
            Manually trigger data sync operations
          </p>
        </div>

        <div className="grid gap-4">
          {SYNC_JOBS.map((job) => {
            const Icon = job.icon;
            const isRunning = running[job.id];
            const result = results[job.id];

            return (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg bg-black/50 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${job.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{job.name}</h4>
                    <p className="text-sm text-gray-400">{job.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {result === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <Button
                    onClick={() => triggerSync(job.id)}
                    disabled={isRunning}
                    className="btn"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      'Run'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-white/10">
          <Button
            onClick={() => Object.keys(SYNC_JOBS).forEach(job => triggerSync(job))}
            className="w-full btn"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4" />
            Run All Sync Jobs
          </Button>
        </div>
      </div>
    </Card>
  );
}
````

### Phase 6: Final Polish (Day 3 Afternoon)

#### 6.1 Global Styling Updates
````css
/* Update button styles */
.btn {
  @apply rounded-sm px-4 py-2 font-medium transition-all duration-200
         border border-white/10 hover:border-white/20
         bg-white/5 hover:bg-white/10
         flex items-center justify-center gap-2
         disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card styles */
.card-gradient {
  @apply bg-gradient-to-b from-gray-900/50 to-black/50 
         border border-white/10 hover:border-white/20
         backdrop-blur-sm;
}

/* Loading skeleton */
.skeleton {
  @apply animate-pulse bg-white/10 rounded-lg;
}
````

#### 6.2 Search Consolidation
Remove duplicate search components and keep only `UnifiedSearch.tsx` with:
- Artist search by name
- Location search by zip code
- Results dropdown with proper styling
- Integration with sync system

### Deployment Checklist

- [ ] Run database migrations
- [ ] Deploy edge functions with correct CRON_SECRET
- [ ] Update Vercel environment variables
- [ ] Test admin panel sync buttons
- [ ] Verify homepage loads 20+ shows
- [ ] Check search functionality
- [ ] Confirm all buttons have consistent styling
- [ ] Test on mobile devices
- [ ] Monitor first sync runs

This revised plan addresses the actual state of your database and focuses on the real gaps that need to be filled.


FIXES NEEDED:

Comprehensive Implementation / Fix Outline
(Session scope: Supabase-based concert-setlist voting platform – NOT Azure)

0. Guiding Principles
Always call existing data-creation pipeline (ticketmaster → spotify → db) instead of ad-hoc fetches.
Make database the single source of truth; homepage caches are derivative.
All manual triggers must use Supabase Edge Functions protected by CRON_SECRET – never run shell scripts from the browser.
Keep UI kit minimal: Tailwind + shadcn/ui; global 2 px radius; dark-mode first.
Ensure type safety end-to-end (Prisma types ↔ GraphQL ↔ React Query).
1. Database & Prisma
Task	How
1.1 Add missing tables	Update schema.prisma <br>prisma<br>// filepath: packages/database/prisma/schema.prisma<br>model PlayedSetlist { … }<br>model PlayedSetlistSong { … }<br>model UserArtist { … }<br><br>Run pnpm db:migrate (dev) & supabase db push (remote).
1.2 View / RPC for homepage	Create SQL file supabase/migrations/*_homepage_content.sql <br>sql<br>CREATE OR REPLACE VIEW public.top_homepage_content AS<br>SELECT DISTINCT ON (a.id) … LIMIT 24;
1.3 RLS for admin role	Add role text column to auth.users metadata; create policy SELECT * WHERE auth.role() = 'admin' OR ….
2. Edge Functions & Cron
Task	How
2.1 Ensure secret guard	At top of every function:<br>ts if (req.headers.get('authorization') !== `Bearer ${Deno.env.get("CRON_SECRET")}`) return new Response("Unauthorized", { status: 401 });
2.2 Required functions list	sync_homepage_orchestrator, sync_trending_shows, sync_ticketmaster_shows, sync_spotify_catalog, refresh_trending_shows (already present—verify).
2.3 Deploy	supabase functions deploy --project-ref ailrmwtahifvstpfhbgn <name>.
3. ENV / Secrets
Add to .env and Vercel dashboard
Remove duplicate keys (SETLIST_FM_API_KEY vs SETLISTFM_API_KEY, keep one).
Commit .env.example with placeholders.
4. Backend (Next.js API Routes)
Route	Purpose	Implementation
/api/admin/trigger/[job]	Invoked by admin buttons	See code skeleton in previous answer – uses service-role key + CRON_SECRET.
/api/search	Single endpoint used by UnifiedSearch	Accept { q, zip }, call server util ensureArtistAndShowsSynced(q) (wraps existing pipeline). Return artists[], shows[].
5. Front-end
5.1 Homepage (pages/index.tsx)
Step	Description
A	Replace client‐side SWR call with getServerSideProps (SSR) that: <br>1. Reads cached public.top_homepage_content. <br>2. If stale (>1 h) → invokes sync_homepage_orchestrator (await but non-blocking).
B	Map to ArtistCard / ShowCard components.
C	Enforce 20 distinct US shows – filter duplicates (show.id).
5.2 Components
Component	Fixes
ArtistCard	Fallback blur data URL; clickable → /artist/[slug].
ShowCard	Display artist image + venue, date; clickable → /show/[id].
UnifiedSearch	Single file under components/; context provider; 2 px radius; debounced 300 ms. Results dropdown absolute below input.
5.3 Profile Page (pages/profile.tsx)
Fetch user/session via @supabase/auth-helpers-nextjs.
Query rpc_is_admin() or read user.role.
If admin → render <AdminPanel />.
<AdminPanel />:

Button	Edge function
Sync All	sync_homepage_orchestrator
Ticketmaster	sync_ticketmaster_shows
Spotify Catalog	sync_spotify_catalog
Trending	refresh_trending_shows
All buttons:

Toast success / error (shadcn use-toast).
5.4 Global Style
Add to globals.css:

Run codemod:

(Replace .rounded-md → .btn).

6. Testing
Unit

Add vitest tests for utils selectVariedSongs, search debounce.
Integration

Cypress flow: visit /, ensure 20 cards load.
Admin flow: login as admin → click “Sync All” → expect success toast.
Backend

Script test-backend-sync-system.sh already present – update to hit API route instead of CLI.
7. CI / CD
Update GitHub Actions to run pnpm run test && pnpm run build.
In Vercel project env, add SUPABASE_*, CRON_SECRET.
8. Documentation
File	Update
docs/SETUP.md	Add section on “Manual sync from Admin panel”.
TheSet-Complete-Analysis-and-Implementation-Plan.md	Mark completed items.
README.md	Quick-start with pnpm dev and supabase link.
9. Execution Order (1-Sprint / 3 days)
Day	Tasks
Day 1	DB schema, env fixes, deploy edge functions.
Day 2	Backend routes, unified search, homepage SSR, cards.
Day 3	Admin panel, styling sweep, tests, docs, CI.
Deliver these checkpoints to maintain momentum:
🔹 DB migrated & edge functions live.
🔹 Homepage renders 20+ shows from DB.
🔹 Admin panel triggers functions successfully.
🔹 All buttons identical styling.