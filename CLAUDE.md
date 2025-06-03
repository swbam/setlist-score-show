# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status: ~50% Complete → 100% Production Ready

### Current Working Features ✅
- **Search**: Ticketmaster API integration with automatic data import
- **Basic Voting**: Real-time voting with limits (10/show, 50/day)
- **Database Schema**: Complete with all required tables
- **Auth**: Basic email/password authentication
- **Real-time Updates**: WebSocket connections for live vote counts

### Critical Missing Features 🔴
1. **Spotify OAuth**: Not configured in Supabase
2. **My Artists**: Import functionality broken
3. **setlist.fm Integration**: Not implemented
4. **Background Jobs**: No cron jobs running
5. **Homepage Design**: Basic, needs "Apple-level" design
6. **Post-Show Comparison**: Not implemented
7. **Trending Calculation**: Manual only, no automation

## Common Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Start development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linting
npm run lint

# Run e2e tests
npx playwright test
```

### Database Operations (via Supabase MCP)
- Use `mcp__supabase__list_tables` to view all tables
- Use `mcp__supabase__execute_sql` for queries
- Use `mcp__supabase__apply_migration` for DDL operations
- Project ID: `ailrmwtahifvstpfhbgn`

## API Credentials
- **VITE_SUPABASE_URL**: https://ailrmwtahifvstpfhbgn.supabase.co
- **VITE_SUPABASE_ANON_KEY**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw
- **SPOTIFY_CLIENT_ID**: 2946864dc822469b9c672292ead45f43
- **SPOTIFY_CLIENT_SECRET**: feaf0fc901124b839b11e02f97d18a8d
- **TICKETMASTER_API_KEY**: k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
- **SETLISTFM_API_KEY**: xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL

## High-Level Architecture

### Core Application Flow
1. **Authentication**: Email/password + Spotify OAuth via Supabase Auth
2. **Data Import**: 
   - Artists from Spotify API (with rate limiting)
   - Shows from Ticketmaster API
   - Played setlists from setlist.fm API
3. **Real-time Voting**: WebSocket subscriptions via Supabase Realtime
4. **Background Jobs**: Vercel cron jobs for data sync and trending calculations

### Key Service Patterns

#### API Integration Pattern
```typescript
// All external APIs use rate limiting and error handling
// Example: src/services/spotify.ts, spotifyRateLimiterEnhanced.ts
class ServiceWithRateLimit {
  private rateLimiter = new RateLimiter();
  async makeRequest() {
    return this.rateLimiter.enqueue(() => fetch(...));
  }
}
```

#### Real-time Subscription Pattern
```typescript
// Memory-leak-free pattern used throughout
// Example: src/hooks/useRealtimeVoting.ts
useEffect(() => {
  const channel = supabase.channel(`name:${id}`);
  // ... subscribe logic
  return () => {
    channel.unsubscribe();
  };
}, [id]);
```

#### Vote Management Pattern
- Database enforces limits: 10 votes per show, 50 daily
- Optimistic UI updates with rollback on failure
- Vote tracking service manages user limits

### Critical Dependencies
- **Supabase**: Database, Auth, Realtime, Storage
- **React Query (TanStack Query)**: Data fetching and caching
- **Vercel**: Hosting and cron jobs
- **External APIs**: Spotify, Ticketmaster, setlist.fm

### Known Issues & Solutions
1. **Spotify Rate Limiting**: Enhanced rate limiter implemented
2. **Memory Leaks**: Fixed in all real-time hooks
3. **TypeScript Issues**: Some `any` types remain (see TYPESCRIPT_CLEANUP_PLAN.md)
4. **Artist Mapping**: Fuzzy matching between Spotify/Ticketmaster

### Testing Approach
- E2E tests in `/e2e` directory using Playwright
- Test user flows: search → artist → show → voting
- Run with `npx playwright test`

### Production Considerations
- Vote limits enforced at database level
- Cron jobs require `CRON_SECRET` for security
- Monitoring needed for API rate limits
- Database indexes optimized for voting queries

## Implementation Priority Order

### Phase 1: Core Authentication & Data Flow (Critical)
1. **Configure Spotify OAuth in Supabase** (Manual step required)
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Spotify provider
   - Add Client ID and Secret from above
   
2. **Fix My Artists Import**
   - Update MyArtistsDashboard component
   - Implement full catalog import (not just top tracks)
   - Fix artist ID mapping between APIs

3. **Complete Spotify Catalog Import**
   - Import all songs, not just top tracks
   - Handle rate limiting properly
   - Store all metadata for setlist matching

### Phase 2: Missing Features
1. **Implement setlist.fm Integration**
   - Create service for API calls
   - Import played setlists after shows
   - Build comparison UI
   
2. **Set up Vercel Cron Jobs**
   - /api/cron/sync-artists.ts (daily)
   - /api/cron/sync-shows.ts (every 6 hours)
   - /api/cron/calculate-trending.ts (hourly)
   - /api/cron/import-setlists.ts (daily)
   
3. **Complete Trending System**
   - Calculate trending scores automatically
   - Update database with scores
   - Display on homepage

### Phase 3: UI/UX Polish
1. **Redesign Homepage**
   - Replace basic hero with "Apple-level" design
   - Add engaging animations
   - Improve call-to-action flow
   
2. **Mobile Experience**
   - Optimize all components for mobile
   - Test touch interactions
   - Improve navigation flow
   
3. **Loading States & Error Handling**
   - Add skeletons for all loading states
   - Implement error boundaries
   - User-friendly error messages

### Phase 4: Production Readiness
1. **Monitoring & Analytics**
   - Set up error tracking (Sentry)
   - Add performance monitoring
   - Track user engagement metrics
   
2. **Security & Performance**
   - Implement rate limiting on endpoints
   - Add request validation
   - Optimize database queries
   
3. **Deployment Configuration**
   - Set up environment variables
   - Configure Vercel deployment
   - Add production domain

## Database Tables Reference

### Core Tables (Already Created)
- **users**: id, email, spotify_id, display_name, avatar_url, created_at
- **artists**: id, name, image_url, popularity, genres[], spotify_url, last_synced_at
- **venues**: id, name, city, state, country, address, latitude, longitude
- **shows**: id, artist_id, venue_id, name, date, start_time, status, ticketmaster_url, view_count
- **songs**: id, artist_id, name, album, duration_ms, popularity, spotify_url
- **setlists**: id, show_id, created_at, updated_at
- **setlist_songs**: id, setlist_id, song_id, position, votes
- **votes**: id, user_id, setlist_song_id, created_at
- **user_artists**: id, user_id, artist_id, rank
- **played_setlists**: id, show_id, setlist_fm_id, played_date, imported_at
- **played_setlist_songs**: id, played_setlist_id, song_id, position
- **vote_limits**: user_id, daily_votes_used, daily_votes_remaining, last_reset, show_votes_used, show_votes_remaining

### Import Tracking Tables
- **artist_import_progress**: artist_id, stage, total_albums, processed_albums, total_tracks, imported_tracks, started_at, completed_at
- **unmapped_artists**: id, ticketmaster_name, event_count, first_seen_at, last_seen_at
- **artist_mapping_candidates**: id, unmapped_artist_id, spotify_artist_id, confidence_score, created_at