# CLAUDE-2.md - Implementation Plan for 100% Completion

## Current Status Analysis (After Code Review)

### ✅ What's Actually Working
1. **Database Schema**: All tables created and properly structured
2. **Basic Auth**: Email/password authentication works
3. **Vote Limits**: Database-enforced limits (10/show, 50/day)
4. **Real-time Updates**: WebSocket subscriptions configured
5. **Rate Limiting**: Spotify rate limiter implemented
6. **Core UI Components**: Most components exist but need fixes

### 🔴 Critical Issues (Blocking Basic Functionality)

#### 1. **Search Not Loading Artists from Ticketmaster**
- **Issue**: SearchResults component only searches local database, not Ticketmaster API
- **Location**: `src/components/SearchResults.tsx`
- **Root Cause**: Missing Ticketmaster API integration in search flow

#### 2. **Homepage Not Loading Shows**
- **Issue**: TrendingShows component queries empty/wrong table
- **Location**: `src/components/TrendingShows.tsx`
- **Root Cause**: No shows are being imported into database

#### 3. **Spotify Login/Import Not Working**
- **Issue**: Spotify OAuth not configured in Supabase + import logic incomplete
- **Location**: `src/components/MyArtistsDashboard.tsx`, `src/services/spotify.ts`
- **Root Cause**: 
  - Supabase Spotify provider not enabled
  - Import only fetches top tracks, not full catalog
  - Missing artist mapping between Spotify/Ticketmaster

#### 4. **Inconsistent Layout/Navigation**
- **Issue**: Different nav components for logged-in vs logged-out states
- **Location**: `src/components/Layout.tsx`, `src/components/Navigation.tsx`
- **Root Cause**: Multiple navigation components without unified design

### 🟡 Secondary Issues (From CLAUDE.md)

5. **setlist.fm Integration**: Not implemented at all
6. **Background Jobs**: No cron jobs created
7. **Trending Calculation**: Manual only, needs automation
8. **Post-Show Comparison**: Feature not built
9. **Homepage Design**: Basic hero, needs polish

## Implementation Order (Critical Path)

### Phase 0: Fix Navigation Consistency (30 min)
**Why First**: Need consistent UI to properly test other features

1. Create unified Navigation component
2. Update Layout to use same nav everywhere
3. Ensure mobile responsiveness

### Phase 1: Fix Ticketmaster Search (1-2 hours)
**Why First**: Core feature - users need to find shows

1. Update SearchResults to call Ticketmaster API
2. Import found artists/shows into database
3. Handle artist mapping/deduplication
4. Add loading states and error handling

### Phase 2: Fix Homepage Shows Display (1 hour)
**Why First**: Main landing experience broken

1. Create shows import from Ticketmaster
2. Fix TrendingShows query
3. Add proper show cards with images
4. Implement view counting

### Phase 3: Complete Spotify Integration (2-3 hours)
**Why First**: Critical for personalized experience

1. **Manual Step**: Configure Spotify OAuth in Supabase Dashboard
2. Fix login flow with proper redirect
3. Implement full catalog import (not just top tracks)
4. Create artist mapping system
5. Add import progress tracking

### Phase 4: Background Jobs Setup (2 hours)
**Why Next**: Keeps data fresh automatically

1. Create Vercel API routes for cron jobs
2. Implement show sync (every 6 hours)
3. Implement trending calculation (hourly)
4. Add setlist import (daily after shows)

### Phase 5: setlist.fm Integration (2 hours)
**Why Next**: Completes the voting cycle

1. Create setlist.fm service
2. Import played setlists after shows
3. Build comparison UI
4. Show voting accuracy

### Phase 6: UI/UX Polish (2-3 hours)
**Why Last**: Functionality first, polish second

1. Redesign homepage hero
2. Add loading skeletons
3. Improve mobile experience
4. Add animations and transitions

## Detailed Implementation Guide

### Fix 1: Navigation Consistency

```typescript
// Create unified Navigation component that works everywhere
// Components to update:
// - src/components/Navigation.tsx (make it responsive to auth state)
// - src/components/Layout.tsx (use single nav component)
// - Remove duplicate navigation logic
```

### Fix 2: Ticketmaster Search Integration

```typescript
// Update SearchResults.tsx to:
// 1. Search Ticketmaster API first
// 2. Import results into database
// 3. Return combined results
// 4. Handle artist deduplication

// Key changes:
// - Add ticketmasterService.searchEvents()
// - Import artists/venues/shows on the fly
// - Map Ticketmaster artists to Spotify artists
```

### Fix 3: Homepage Shows

```typescript
// Fix TrendingShows.tsx:
// 1. Query actual shows table with proper joins
// 2. Add Ticketmaster sync to populate shows
// 3. Calculate trending based on votes/views
// 4. Display with proper formatting
```

### Fix 4: Spotify Full Integration

```typescript
// Steps:
// 1. Enable Spotify in Supabase Dashboard (manual)
// 2. Update auth flow in AuthForm.tsx
// 3. Fix MyArtistsDashboard.tsx import logic
// 4. Implement full catalog import in spotify.ts
// 5. Create artist mapping service
```

### Fix 5: Background Jobs

```typescript
// Create these Vercel API routes:
// - /api/cron/sync-shows.ts
// - /api/cron/calculate-trending.ts  
// - /api/cron/import-setlists.ts
// - /api/cron/sync-artists.ts

// Add to vercel.json:
// crons configuration for each job
```

## Testing Checklist

### Core User Flow
- [ ] User can search for artists/shows
- [ ] Search results load from Ticketmaster
- [ ] Homepage displays trending shows
- [ ] User can create account
- [ ] User can login with Spotify
- [ ] User can import their artists
- [ ] User can vote on setlists
- [ ] Votes update in real-time
- [ ] Vote limits are enforced
- [ ] Post-show comparison works

### Data Flow
- [ ] Ticketmaster data imports correctly
- [ ] Spotify data imports correctly
- [ ] Artist mapping works
- [ ] Background jobs run on schedule
- [ ] Trending calculations update

### UI/UX
- [ ] Navigation is consistent
- [ ] Mobile experience works
- [ ] Loading states show properly
- [ ] Errors are handled gracefully
- [ ] Real-time updates work

## Database Queries Needed

```sql
-- Check if shows exist
SELECT COUNT(*) FROM shows;

-- Check artist mappings
SELECT * FROM artists WHERE spotify_id IS NOT NULL;

-- Check vote counts
SELECT show_id, COUNT(*) as vote_count 
FROM votes v
JOIN setlist_songs ss ON v.setlist_song_id = ss.id
JOIN setlists s ON ss.setlist_id = s.id
GROUP BY show_id;

-- Check trending scores
SELECT * FROM shows ORDER BY trending_score DESC LIMIT 10;
```

## Environment Variables Needed

```bash
# Already have (from CLAUDE.md):
VITE_SUPABASE_URL=https://ailrmwtahifvstpfhbgn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL

# Need to add:
CRON_SECRET=<generate-random-string>
SPOTIFY_REDIRECT_URI=http://localhost:8080/auth/callback
```

## Manual Steps Required

1. **Enable Spotify OAuth in Supabase**
   - Go to: https://supabase.com/dashboard/project/ailrmwtahifvstpfhbgn/auth/providers
   - Enable Spotify provider
   - Add Client ID: 2946864dc822469b9c672292ead45f43
   - Add Client Secret: feaf0fc901124b839b11e02f97d18a8d
   - Set redirect URL: http://localhost:8080/auth/callback

2. **Configure Vercel Cron Jobs** (after deployment)
   - Add cron configurations to vercel.json
   - Set CRON_SECRET in Vercel environment variables

## Success Metrics

- **Search Success**: Returns Ticketmaster results in <2 seconds
- **Import Success**: Can import 1000+ songs per artist
- **Vote Success**: Real-time updates in <100ms
- **Performance**: Homepage loads in <1 second
- **Reliability**: 99%+ uptime with proper error handling

## Next Steps After This Implementation

1. Add analytics tracking
2. Implement social sharing
3. Add email notifications
4. Create admin dashboard
5. Add more visualization features
