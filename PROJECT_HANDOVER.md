# TheSet - Comprehensive Project Handover Documentation

## Executive Summary

TheSet is a sophisticated concert setlist voting platform that enables users to collaboratively predict and vote on artists' setlists for upcoming shows. The application serves as a social prediction platform where music fans can engage with upcoming concerts through democratic setlist creation, real-time voting, and post-show accuracy comparison.

### Business Value Proposition
- **Community Engagement**: Creates active fan communities around upcoming concerts
- **Predictive Analytics**: Generates valuable data on fan preferences and concert expectations
- **Social Music Discovery**: Enables discovery of new artists and songs through community voting
- **Concert Enhancement**: Provides additional engagement layer for concert-goers

## Application Architecture Overview

### Core Features & User Journeys

1. **Artist Discovery & Following**
   - Multi-source artist search (Spotify, Ticketmaster integration)
   - Comprehensive artist profiles with upcoming shows
   - Spotify catalog import with batch processing
   - Trending artists based on voting activity and upcoming shows
   - Artist following with personalized notifications

2. **Show Management & Discovery**
   - Real-time show tracking with automatic updates
   - Comprehensive venue information and mapping
   - Direct ticket purchase links (Ticketmaster integration)
   - View counts and popularity tracking with trending algorithms
   - Location-based show discovery

3. **Collaborative Setlist Voting**
   - Democratic setlist creation with community input
   - Real-time voting with instant feedback
   - Smart vote limits (10 per show, 50 per day) to prevent spam
   - Song suggestions from full artist catalog
   - Vote confidence scoring and trending factors

4. **Real-time Features**
   - Live vote counting with WebSocket connections
   - Advanced trending calculations with time decay
   - User activity feeds and notifications
   - Background synchronization with external APIs
   - Real-time vote validation and fraud prevention

5. **Post-Show Analytics**
   - Setlist.fm integration for actual setlist comparison
   - User prediction accuracy scoring
   - Community prediction analytics
   - Historical performance tracking

## Advanced Technical Architecture

### Frontend Technology Stack
- **React 18.3.1** with TypeScript for type-safe component development
- **Vite 5.4.1** for lightning-fast build tooling and hot module replacement
- **TanStack Query (React Query) v5** for sophisticated data management with:
  - Intelligent caching strategies
  - Background refetching
  - Optimistic updates
  - Error boundary integration
- **Tailwind CSS 3.4** with custom design system for consistent styling
- **Radix UI** component library for accessible, unstyled primitives
- **Framer Motion** for fluid animations and micro-interactions
- **React Router v6** with protected route handling
- **Sonner** for elegant toast notifications with queuing

### Backend & Infrastructure
- **Supabase** as primary backend service providing:
  - PostgreSQL database with advanced indexing
  - Real-time subscriptions via WebSockets
  - Row Level Security (RLS) for data protection
  - Edge Functions for serverless computing
  - Built-in authentication with OAuth providers
- **Vercel** for hosting with:
  - Edge deployment for global performance
  - Serverless functions for API endpoints
  - Automatic deployments from Git
  - Performance monitoring and analytics

### External API Integrations
- **Spotify Web API**: Artist metadata, song catalogs, album artwork, popularity metrics
- **Ticketmaster Discovery API**: Live event data, venue information, ticket availability
- **Setlist.fm API**: Historical setlist data for post-show comparison and accuracy scoring

### Database Architecture Deep Dive

#### Core Tables & Relationships
```sql
-- Primary entities
artists (id, name, spotify_id, ticketmaster_id, image_url, genres[], popularity, last_synced_at)
venues (id, name, city, state, country, capacity, ticketmaster_venue_id)
shows (id, artist_id, venue_id, name, date, status, ticket_url, view_count, trending_score)
songs (id, name, artist_id, album, spotify_url, duration_ms, popularity)

-- Voting system
setlists (id, show_id, created_by, created_at, is_official, total_votes)
setlist_songs (id, setlist_id, song_id, position, votes, confidence_score)
votes (id, user_id, setlist_song_id, created_at)

-- User engagement
user_artists (user_id, artist_id, followed_at)
user_profiles (user_id, display_name, avatar_url, total_votes, accuracy_score)

-- Analytics & trending
trending_shows (materialized view with vote velocity, time factors)
user_vote_stats (daily/weekly vote tracking)
```

#### Advanced Database Features
- **Materialized Views**: Pre-calculated trending scores for performance
- **Database Functions**: Complex business logic implemented in PostgreSQL
- **Indexes**: Optimized for high-frequency queries (voting, trending, search)
- **Real-time Triggers**: Automatic vote count updates and trending recalculation
- **Connection Pooling**: Managed connection limits with queue system

### Service Architecture & Data Flow

#### Core Services Structure
```
src/services/
├── auth.ts                    # Authentication & session management
├── spotify.ts                 # Spotify API integration & rate limiting
├── ticketmaster.ts           # Event data synchronization
├── setlistfm.ts              # Historical setlist comparison
├── realtime.ts               # WebSocket connection management
├── databaseManager.ts        # Connection pooling & query optimization
├── enhancedTrending.ts       # Advanced trending algorithms
├── userAnalytics.ts          # User behavior analytics
├── backgroundJobs.ts         # Scheduled task execution
├── cacheService.ts           # Redis-compatible caching layer
├── errorHandling.ts          # Centralized error management
└── mappingService.ts         # Cross-platform artist ID mapping
```

#### Data Flow Patterns

**Voting Flow**:
1. User initiates vote → Frontend validation
2. Vote limits check → Database function validation
3. Optimistic UI update → Real-time broadcast
4. Database transaction → Vote count increment
5. Trending score recalculation → Cache invalidation

**Artist Import Flow**:
1. Spotify search → Rate-limited API calls
2. Artist data normalization → Database storage
3. Catalog import queue → Background processing
4. Progress tracking → Real-time updates
5. Error handling → Retry mechanisms

**Real-time Updates**:
1. Database change → PostgreSQL trigger
2. Supabase real-time → WebSocket broadcast
3. Client subscription → State updates
4. UI re-render → Optimistic updates
5. Error recovery → Reconnection logic

## Comprehensive Implementation Status

### ✅ Production-Ready Features

#### 1. Authentication & User Management
**Status**: Fully implemented and tested
- Email/password registration with validation
- Spotify OAuth integration with token refresh
- Session persistence with automatic renewal
- Protected route implementation with role-based access
- User profile management with avatar support
- **Location**: `src/services/auth.ts`, `src/context/AuthContext.tsx`

#### 2. Artist Management System
**Status**: Core features complete, enhancements ongoing
- Multi-source artist search (Spotify + Ticketmaster)
- Artist profile pages with comprehensive metadata
- Spotify catalog import with progress tracking
- Artist following system with notifications
- Genre categorization and filtering
- **Location**: `src/services/spotify.ts`, `src/components/ArtistSearch.tsx`

#### 3. Show Discovery & Management
**Status**: Fully operational with real-time updates
- Ticketmaster API integration for live event data
- Comprehensive venue information with mapping
- Show popularity tracking with view counts
- Automated show synchronization (every 6 hours)
- Ticket purchase links with affiliate tracking
- **Location**: `src/services/ticketmaster.ts`, `src/components/TrendingShows.tsx`

#### 4. Real-time Infrastructure
**Status**: Advanced implementation with monitoring
- WebSocket connections via Supabase real-time
- Connection pool management with failover
- Live vote updates with conflict resolution
- Background sync with error recovery
- Cache management with TTL strategies
- **Location**: `src/services/realtime.ts`, `src/hooks/useRealtimeVoting.ts`

#### 5. Database Layer
**Status**: Production-optimized with advanced features
- PostgreSQL with performance indexes
- Materialized views for trending calculations
- Database functions for complex business logic
- Row Level Security for data protection
- Automated backup and monitoring
- **Location**: `supabase/migrations/`, `src/services/databaseManager.ts`

### 🚧 Features in Active Development

#### 1. MyArtistsDashboard Enhancement
**Status**: 85% complete, needs final polish
**What's Done**:
- Core component structure with responsive layout
- React Query integration with error handling
- Spotify import functionality with multiple artists
- Grid/list view toggle with preferences
- Loading states and skeleton components
- Accessibility improvements (ARIA labels, keyboard navigation)

**What's Needed**:
- Mobile responsive optimizations (grid spacing, touch targets)
- Performance optimizations for large artist lists (virtualization)
- Enhanced error recovery with retry mechanisms
- Advanced filtering options (genre, popularity, recent activity)
- **Estimated Time**: 8-12 hours
- **Location**: `src/components/MyArtistsDashboard.tsx`

#### 2. Advanced Search & Filtering
**Status**: 70% complete, core functionality working
**What's Done**:
- Basic search with debouncing
- Artist and show search integration
- Filter UI components
- Query parameter management

**What's Needed**:
- Location-based filtering with geolocation
- Date range filtering with calendar picker
- Genre hierarchy implementation
- Search result ranking algorithm
- Search analytics and popular queries
- **Estimated Time**: 12-16 hours
- **Location**: `src/components/SearchWithFilters.tsx`

#### 3. Setlist.fm Integration
**Status**: 60% complete, basic comparison working
**What's Done**:
- API integration for historical setlists
- Basic comparison UI
- Data mapping between platforms

**What's Needed**:
- Post-show accuracy scoring algorithm
- Historical data analysis with trends
- Prediction confidence algorithms
- User accuracy leaderboards
- **Estimated Time**: 16-20 hours
- **Location**: `src/services/setlistfm.ts`, `src/components/SetlistComparison.tsx`

### ❌ High-Priority Missing Features

#### 1. Production-Scale Spotify Catalog Import
**Status**: Prototype only, needs complete rebuild
**Critical Issues**:
- No proper rate limiting (will cause API bans)
- Missing batch processing for large catalogs
- No progress persistence (failures restart from beginning)
- Memory leaks with large datasets
- No duplicate detection

**Requirements**:
- Implement queue-based processing with Redis
- Add exponential backoff for rate limits
- Create resumable import sessions
- Implement proper error handling and logging
- Add progress tracking dashboard
- **Estimated Time**: 24-30 hours
- **Priority**: CRITICAL - Must complete before launch

#### 2. Artist ID Mapping Service
**Status**: Basic implementation, needs production hardening
**Critical Issues**:
- Manual mapping process (not scalable)
- Missing fuzzy matching algorithms
- No confidence scoring for matches
- Limited admin interface

**Requirements**:
- Implement machine learning matching algorithms
- Create comprehensive admin interface
- Add manual override system with approval workflow
- Implement mapping confidence scoring
- Add bulk import/export functionality
- **Estimated Time**: 20-24 hours
- **Priority**: HIGH - Required for data consistency

#### 3. Comprehensive Testing Suite
**Status**: Minimal testing, production-blocking issue
**Critical Gaps**:
- No unit tests for business logic
- Missing integration tests for API interactions
- No E2E tests for user workflows
- No performance testing
- No load testing for voting system

**Requirements**:
- Unit tests for all service modules (Jest)
- Integration tests for external APIs (MSW)
- E2E tests for critical user paths (Playwright)
- Performance tests for database queries
- Load tests for real-time voting
- **Estimated Time**: 30-40 hours
- **Priority**: CRITICAL - Must complete before production launch

#### 4. Production Monitoring & Observability
**Status**: Basic logging only
**Missing Components**:
- Application performance monitoring (APM)
- Error tracking and alerting
- Database performance monitoring
- API rate limit monitoring
- User analytics dashboard

**Requirements**:
- Implement Sentry for error tracking
- Add DataDog or equivalent for APM
- Create monitoring dashboards
- Set up alerting for critical issues
- Implement user behavior analytics
- **Estimated Time**: 16-20 hours
- **Priority**: HIGH - Required for production operations

## Advanced Database Schema & Business Logic

### Complete Table Structure

#### Core Domain Tables
```sql
-- Artists with multi-platform IDs
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  spotify_id TEXT UNIQUE,
  ticketmaster_id TEXT,
  ticketmaster_name TEXT, -- For fuzzy matching
  image_url TEXT,
  genres TEXT[] DEFAULT '{}',
  popularity INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Venues with comprehensive location data
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  address TEXT,
  capacity INTEGER,
  ticketmaster_venue_id TEXT UNIQUE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shows with advanced tracking
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  ticket_url TEXT,
  ticketmaster_event_id TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  trending_score DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Songs with Spotify metadata
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  album TEXT,
  spotify_url TEXT,
  spotify_id TEXT UNIQUE,
  duration_ms INTEGER,
  popularity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Voting System Tables
```sql
-- Setlists for collaborative creation
CREATE TABLE setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  is_official BOOLEAN DEFAULT false,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(show_id) -- One setlist per show
);

-- Setlist songs with voting data
CREATE TABLE setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  confidence_score DECIMAL(5,4) DEFAULT 0,
  trending_factor DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(setlist_id, song_id)
);

-- Individual votes with limits
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setlist_song_id UUID REFERENCES setlist_songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, setlist_song_id)
);

-- User vote tracking for limits
CREATE TABLE user_vote_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily_votes INTEGER DEFAULT 0,
  weekly_votes INTEGER DEFAULT 0,
  monthly_votes INTEGER DEFAULT 0,
  last_vote_date DATE DEFAULT CURRENT_DATE,
  total_votes INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,4) DEFAULT 0
);
```

### Critical Database Functions

#### Vote Management with Limits
```sql
CREATE OR REPLACE FUNCTION vote_for_song(
  p_user_id UUID,
  p_setlist_song_id UUID
) RETURNS VOID AS $$
DECLARE
  v_show_votes INTEGER;
  v_daily_votes INTEGER;
BEGIN
  -- Check if already voted
  IF EXISTS (SELECT 1 FROM votes WHERE user_id = p_user_id AND setlist_song_id = p_setlist_song_id) THEN
    RAISE EXCEPTION 'Already voted for this song';
  END IF;
  
  -- Check show-specific vote limit (10 per show)
  SELECT COUNT(*) INTO v_show_votes
  FROM votes v
  JOIN setlist_songs ss ON v.setlist_song_id = ss.id
  JOIN setlists s ON ss.setlist_id = s.id
  WHERE v.user_id = p_user_id 
  AND s.show_id = (
    SELECT s2.show_id FROM setlist_songs ss2 
    JOIN setlists s2 ON ss2.setlist_id = s2.id 
    WHERE ss2.id = p_setlist_song_id
  );
  
  IF v_show_votes >= 10 THEN
    RAISE EXCEPTION 'Show vote limit reached (10 votes per show)';
  END IF;
  
  -- Check daily vote limit (50 per day)
  SELECT COUNT(*) INTO v_daily_votes
  FROM votes 
  WHERE user_id = p_user_id 
  AND DATE(created_at) = CURRENT_DATE;
  
  IF v_daily_votes >= 50 THEN
    RAISE EXCEPTION 'Daily vote limit reached (50 votes per day)';
  END IF;
  
  -- Insert vote and update counts atomically
  INSERT INTO votes (user_id, setlist_song_id) VALUES (p_user_id, p_setlist_song_id);
  UPDATE setlist_songs SET votes = votes + 1 WHERE id = p_setlist_song_id;
  UPDATE setlists SET total_votes = total_votes + 1 
  WHERE id = (SELECT setlist_id FROM setlist_songs WHERE id = p_setlist_song_id);
  
  -- Update user stats
  INSERT INTO user_vote_stats (user_id, daily_votes, total_votes, last_vote_date)
  VALUES (p_user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_votes = CASE WHEN user_vote_stats.last_vote_date = CURRENT_DATE 
                  THEN user_vote_stats.daily_votes + 1 ELSE 1 END,
    total_votes = user_vote_stats.total_votes + 1,
    last_vote_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

#### Trending Algorithm Implementation
```sql
-- Materialized view for performance
CREATE MATERIALIZED VIEW trending_shows AS
SELECT 
  s.id AS show_id,
  s.artist_id,
  s.venue_id,
  s.name AS show_name,
  s.date AS show_date,
  s.view_count,
  COUNT(DISTINCT v.user_id) as unique_voters,
  COALESCE(SUM(ss.votes), 0) as total_votes,
  -- Advanced trending score calculation
  (
    s.view_count * 0.3 + 
    COALESCE(SUM(ss.votes), 0) * 0.4 +
    COUNT(DISTINCT v.user_id) * 0.3 *
    -- Time decay factor (closer to show date = higher score)
    CASE 
      WHEN s.date <= NOW() + INTERVAL '7 days' THEN 2.0
      WHEN s.date <= NOW() + INTERVAL '30 days' THEN 1.5
      WHEN s.date <= NOW() + INTERVAL '90 days' THEN 1.0
      ELSE 0.5
    END
  ) as trending_score
FROM shows s
LEFT JOIN setlists sl ON sl.show_id = s.id
LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
LEFT JOIN votes v ON v.setlist_song_id = ss.id
WHERE s.date >= CURRENT_DATE
GROUP BY s.id;

-- Function to refresh trending data
CREATE OR REPLACE FUNCTION refresh_trending_shows()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows;
END;
$$ LANGUAGE plpgsql;
```

### Performance Optimization Indexes

```sql
-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_shows_date_status ON shows(date, status) WHERE status = 'upcoming';
CREATE INDEX CONCURRENTLY idx_votes_user_date ON votes(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_setlist_songs_votes ON setlist_songs(votes DESC, setlist_id);
CREATE INDEX CONCURRENTLY idx_artists_popularity ON artists(popularity DESC) WHERE popularity > 0;
CREATE INDEX CONCURRENTLY idx_shows_trending_score ON shows(trending_score DESC) WHERE trending_score > 0;

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_artists_search ON artists USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY idx_songs_search ON songs USING gin(to_tsvector('english', name || ' ' || album));
CREATE INDEX CONCURRENTLY idx_venues_search ON venues USING gin(to_tsvector('english', name || ' ' || city));
```

## Critical Development Paths & Implementation Roadmap

### Phase 1: Production Readiness (Immediate - 2-3 weeks)

#### 1. Complete Spotify Catalog Import System (CRITICAL)
**Current State**: Basic prototype with major production issues
**Required Implementation**:
```typescript
// services/catalogImportEnhanced.ts - NEW FILE NEEDED
interface ImportJob {
  id: string;
  artistId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalTracks: number;
  processedTracks: number;
  errors: string[];
  resumeToken?: string;
}

class ProductionCatalogImporter {
  // Rate limiting with exponential backoff
  // Resumable imports with state persistence
  // Error recovery with retry logic
  // Progress tracking and notifications
  // Memory-efficient streaming processing
}
```
**Implementation Steps**:
1. Create queue-based processing system (4-6 hours)
2. Implement rate limiting with Redis (3-4 hours)
3. Add resumable import with state persistence (6-8 hours)
4. Build progress tracking dashboard (4-6 hours)
5. Add comprehensive error handling (4-6 hours)
6. **Total Estimated Time**: 21-30 hours
7. **Priority**: CRITICAL - Blocks production launch

#### 2. Artist ID Mapping Service Enhancement (HIGH)
**Current State**: Manual mapping only, not scalable
**Required Implementation**:
```typescript
// services/artistMappingEnhanced.ts - ENHANCEMENT NEEDED
interface MappingCandidate {
  confidence: number;
  spotifyId: string;
  ticketmasterId: string;
  matchingFactors: string[];
  needsReview: boolean;
}

class IntelligentMappingService {
  // Fuzzy string matching algorithms
  // Machine learning confidence scoring
  // Admin approval workflow
  // Bulk mapping operations
  // Manual override system
}
```
**Implementation Steps**:
1. Implement fuzzy matching algorithms (8-10 hours)
2. Create confidence scoring system (6-8 hours)
3. Build admin interface for review (8-10 hours)
4. Add bulk operations (4-6 hours)
5. **Total Estimated Time**: 26-34 hours
6. **Priority**: HIGH - Required for data consistency

#### 3. Comprehensive Testing Suite (CRITICAL)
**Current State**: Minimal testing coverage
**Required Coverage**:
```typescript
// tests/ directory structure
tests/
├── unit/
│   ├── services/        # All service modules
│   ├── hooks/          # React hooks
│   ├── components/     # UI components
│   └── utils/          # Utility functions
├── integration/
│   ├── api/            # External API mocking
│   ├── database/       # Database operations
│   └── auth/           # Authentication flows
├── e2e/
│   ├── user-flows/     # Complete user journeys
│   ├── voting/         # Voting system
│   └── real-time/      # Real-time features
└── performance/
    ├── load/           # Load testing
    ├── stress/         # Stress testing
    └── database/       # Query performance
```
**Implementation Plan**:
1. Unit tests for services (12-16 hours)
2. Component testing with React Testing Library (8-12 hours)
3. Integration tests with MSW (6-8 hours)
4. E2E tests with Playwright (8-12 hours)
5. Performance testing setup (6-8 hours)
6. **Total Estimated Time**: 40-56 hours
7. **Priority**: CRITICAL - Must complete before production

### Phase 2: Feature Completion (3-4 weeks)

#### 1. MyArtistsDashboard Finalization
**Status**: 85% complete, final polish needed
**Remaining Work**:
- Mobile responsive optimizations (4-6 hours)
- Performance optimizations with virtualization (6-8 hours)
- Advanced filtering implementation (4-6 hours)
- Error recovery enhancements (3-4 hours)
- **Total Time**: 17-24 hours

#### 2. Advanced Search & Filtering
**Status**: 70% complete, core functionality working
**Remaining Work**:
- Location-based filtering with geolocation (8-10 hours)
- Date range filtering with calendar (4-6 hours)
- Genre hierarchy implementation (6-8 hours)
- Search ranking algorithm (4-6 hours)
- **Total Time**: 22-30 hours

#### 3. Setlist.fm Integration Enhancement
**Status**: 60% complete, basic features working
**Remaining Work**:
- Post-show accuracy scoring (8-12 hours)
- Historical analysis algorithms (10-14 hours)
- Prediction confidence scoring (6-8 hours)
- User leaderboards (4-6 hours)
- **Total Time**: 28-40 hours

### Phase 3: Production Operations (2-3 weeks)

#### 1. Monitoring & Observability
**Implementation Required**:
```typescript
// monitoring/analytics.ts - NEW FILE NEEDED
interface AppMetrics {
  userEngagement: UserEngagementMetrics;
  systemPerformance: SystemPerformanceMetrics;
  businessMetrics: BusinessMetrics;
  errorTracking: ErrorMetrics;
}

class ProductionMonitoring {
  // Sentry error tracking integration
  // Performance monitoring with DataDog
  // Custom business metrics dashboard
  // Alert system for critical issues
  // User behavior analytics
}
```
**Setup Requirements**:
1. Sentry integration for error tracking (4-6 hours)
2. APM setup with DataDog or equivalent (6-8 hours)
3. Custom metrics dashboard (8-12 hours)
4. Alert configuration (4-6 hours)
5. User analytics implementation (6-8 hours)
6. **Total Time**: 28-40 hours

#### 2. Deployment & DevOps Enhancement
**Current State**: Basic Vercel deployment
**Production Requirements**:
```yaml
# .github/workflows/production-deploy.yml - NEW FILE NEEDED
name: Production Deployment
on:
  push:
    branches: [main]
jobs:
  test:
    # Run full test suite
    # Performance testing
    # Security scanning
  deploy:
    # Blue-green deployment
    # Database migration checks
    # Rollback capabilities
  monitor:
    # Post-deployment verification
    # Performance monitoring
    # Error rate monitoring
```
**Implementation Steps**:
1. CI/CD pipeline enhancement (6-8 hours)
2. Blue-green deployment setup (4-6 hours)
3. Database migration automation (4-6 hours)
4. Rollback procedures (3-4 hours)
5. **Total Time**: 17-24 hours

### Critical Success Metrics

#### Pre-Launch Checklist
- [ ] Spotify catalog import handles 10,000+ songs without failure
- [ ] Artist mapping accuracy > 95% with confidence scoring
- [ ] Test coverage > 80% across all critical paths
- [ ] Page load times < 2 seconds for all major pages
- [ ] Real-time voting supports 100+ concurrent users
- [ ] Error tracking and monitoring fully operational
- [ ] Database performance optimized for production load

#### Performance Targets
- **Page Load Times**: < 2 seconds initial load, < 500ms subsequent navigation
- **Real-time Updates**: < 100ms latency for vote updates
- **Database Queries**: < 50ms for 95th percentile
- **API Rate Limits**: Graceful handling with retry logic
- **Error Rates**: < 0.1% for critical user flows

#### Scalability Targets
- **Concurrent Users**: Support 1,000+ simultaneous voters
- **Database Connections**: Efficient pooling with max 50 connections
- **Memory Usage**: < 512MB per serverless function
- **Storage**: Efficient image and data storage with CDN

## Known Issues & Technical Debt

### Critical Production Blockers

#### 1. Spotify API Rate Limiting (CRITICAL)
**Issue**: Current implementation will trigger API bans in production
**Location**: `src/services/spotify.ts`
**Problem**: 
- No request queuing system
- Missing exponential backoff
- Batch requests not properly throttled
- No rate limit detection/recovery

**Fix Required**:
```typescript
// Implement proper rate limiting
class SpotifyRateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 100; // ms between requests
  
  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
}
```
**Priority**: CRITICAL - Must fix before production launch

#### 2. Memory Leaks in Real-time Connections (HIGH)
**Issue**: WebSocket connections not properly cleaned up
**Location**: `src/hooks/useRealtimeVoting.ts`, `src/services/realtime.ts`
**Problem**:
- Event listeners accumulate over time
- Channels not unsubscribed on component unmount
- Connection pool grows without bounds

**Fix Required**:
```typescript
// Enhanced cleanup in useRealtimeVoting
useEffect(() => {
  // ...existing setup code...
  
  return () => {
    // Proper cleanup
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsConnected(false);
    setVoteCounts({});
  };
}, [setlistId]);
```

#### 3. Database Connection Pool Exhaustion (HIGH)
**Issue**: Connection pool can be exhausted under load
**Location**: `src/services/databaseManager.ts`
**Problem**:
- No connection timeout handling
- Queue can grow infinitely
- No connection health monitoring

**Fix Required**: Implement connection health checks and timeouts

#### 4. Race Conditions in Voting System (MEDIUM)
**Issue**: Concurrent votes can bypass limits
**Location**: Database vote functions
**Problem**: TOCTOU (Time-of-Check-Time-of-Use) in vote validation

**Fix Required**: Use database-level constraints and transactions

### Performance Issues

#### 1. Large Setlist Rendering Performance
**Issue**: Pages with 50+ songs render slowly
**Location**: `src/components/VotingInterface.tsx`
**Impact**: Poor user experience for popular artists
**Fix**: Implement virtualization with react-window

#### 2. Image Loading Without Optimization
**Issue**: Large artist images not optimized
**Location**: Various components using artist images
**Impact**: Slow page loads, poor mobile experience
**Fix**: Implement WebP conversion and responsive images

#### 3. Inefficient Database Queries
**Issue**: N+1 queries in some components
**Location**: Artist and show loading components
**Impact**: Increased database load and response times
**Fix**: Implement proper JOIN queries and batch loading

### Data Consistency Issues

#### 1. Duplicate Show Detection
**Issue**: Same show can be imported multiple times
**Location**: `src/services/ticketmaster.ts`
**Impact**: Confusing user experience, data pollution
**Fix**: Implement robust deduplication logic

#### 2. Artist Name Variations
**Issue**: Same artist with different names across platforms
**Location**: Artist import and mapping services
**Impact**: Fragmented data, poor search results
**Fix**: Enhanced fuzzy matching and canonical name system

#### 3. Stale Cache Data
**Issue**: Cached data not properly invalidated
**Location**: `src/services/cacheService.ts`
**Impact**: Users see outdated information
**Fix**: Implement cache dependency tracking

## Production Deployment Guide

### Environment Configuration

#### Required Environment Variables
```bash
# Core Application
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# External APIs
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
TICKETMASTER_API_KEY=your-ticketmaster-api-key
SETLISTFM_API_KEY=your-setlistfm-api-key

# Production Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Security
CRON_SECRET=your-secure-random-string
JWT_SECRET=your-jwt-secret

# Redis (for production caching)
REDIS_URL=redis://your-redis-instance
```

#### Supabase Configuration
```sql
-- Required RLS policies
CREATE POLICY "Users can read public artist data" ON artists FOR SELECT USING (true);
CREATE POLICY "Users can read public show data" ON shows FOR SELECT USING (true);
CREATE POLICY "Users can vote on setlists" ON votes FOR INSERT USING (auth.uid() = user_id);
CREATE POLICY "Users can read their own votes" ON votes FOR SELECT USING (auth.uid() = user_id);

-- Required database extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
```

### Build & Deployment Process

#### Local Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start Supabase locally (optional)
npx supabase start

# 4. Run database migrations
npx supabase db reset

# 5. Start development server
npm run dev
```

#### Production Build Process
```bash
# 1. Install dependencies
npm ci --production=false

# 2. Run full test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# 3. Build for production
npm run build

# 4. Verify build
npm run preview

# 5. Deploy to Vercel
vercel --prod
```

#### Database Migration Strategy
```bash
# 1. Backup production database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Test migrations on staging
npx supabase db push --linked --include-all

# 3. Apply to production (with rollback plan)
npx supabase db push --linked --include-all --dry-run
npx supabase db push --linked --include-all
```

### Monitoring & Alerting Setup

#### Critical Metrics to Monitor
```typescript
// Key performance indicators
interface ProductionMetrics {
  // User engagement
  dailyActiveUsers: number;
  votesPerDay: number;
  averageSessionDuration: number;
  
  // System performance
  apiResponseTime95p: number;
  databaseQueryTime95p: number;
  errorRate: number;
  
  // Business metrics
  newUserRegistrations: number;
  artistImportsPerDay: number;
  showsWithActiveVoting: number;
}
```

#### Alert Configuration
```yaml
# alerts.yml - For your monitoring system
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 1%"
    severity: "critical"
    action: "page-oncall"
    
  - name: "Slow API Response"
    condition: "api_response_time_95p > 2000ms"
    severity: "warning"
    action: "slack-notification"
    
  - name: "Database Connection Pool Full"
    condition: "db_connections_active > 45"
    severity: "critical"
    action: "auto-scale"
```

### Cron Job Configuration

#### Vercel Cron Setup
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-artists",
      "schedule": "0 3 * * *",
      "description": "Daily artist data synchronization"
    },
    {
      "path": "/api/cron/sync-shows", 
      "schedule": "0 */6 * * *",
      "description": "Show data updates every 6 hours"
    },
    {
      "path": "/api/cron/calculate-trending",
      "schedule": "0 */4 * * *", 
      "description": "Trending calculations every 4 hours"
    },
    {
      "path": "/api/cron/import-setlists",
      "schedule": "0 12 * * *",
      "description": "Daily setlist.fm import"
    }
  ]
}
```

#### Monitoring Cron Job Health
```typescript
// api/cron/health-check.ts
export default async function handler(req: Request) {
  const healthMetrics = {
    lastSyncTimes: {
      artists: await getLastSyncTime('artists'),
      shows: await getLastSyncTime('shows'),
      trending: await getLastSyncTime('trending')
    },
    jobStatuses: await getJobStatuses(),
    systemHealth: await checkSystemHealth()
  };
  
  // Alert if any job is overdue
  // Report metrics to monitoring system
}
```

### Security Configuration

#### Content Security Policy
```typescript
// next.config.js or similar
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: *.spotify.com *.ticketmaster.com;
      connect-src 'self' *.supabase.co *.spotify.com api.setlist.fm;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

#### Rate Limiting Setup
```typescript
// middleware/rateLimiting.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 requests per hour
});

export async function middleware(request: Request) {
  const identifier = getClientIdentifier(request);
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
}
```

## Comprehensive Next Steps & Development Roadmap

### Immediate Actions (Week 1-2) - CRITICAL PATH

#### Day 1-3: Address Production Blockers
1. **Fix Spotify Rate Limiting**
   - Implement request queue system in `src/services/spotify.ts`
   - Add exponential backoff logic
   - Create rate limit detection and recovery
   - **Owner**: Senior Frontend Developer
   - **Review**: Lead Developer

2. **Memory Leak Fixes**
   - Audit all React hooks for proper cleanup
   - Fix WebSocket connection management
   - Implement connection pooling limits
   - **Owner**: Frontend Developer
   - **Review**: Senior Developer

3. **Database Connection Optimization**
   - Add connection timeout handling
   - Implement health checks
   - Set up connection monitoring
   - **Owner**: Backend Developer
   - **Review**: DevOps Engineer

#### Day 4-7: Testing Infrastructure
1. **Unit Test Implementation**
   - Cover all service modules (priority: auth, voting, real-time)
   - Component testing for critical UI elements
   - Hook testing for custom React hooks
   - **Target**: 80% coverage minimum
   - **Owner**: Full-stack Developer + QA Engineer

2. **Integration Testing**
   - Mock external APIs (Spotify, Ticketmaster, Setlist.fm)
   - Database operation testing
   - Authentication flow testing
   - **Owner**: QA Engineer + Backend Developer

#### Week 2: Performance & Monitoring
1. **Performance Optimization**
   - Implement lazy loading for large components
   - Add image optimization
   - Database query optimization
   - **Owner**: Frontend + Backend Developers

2. **Monitoring Setup**
   - Sentry error tracking integration
   - Performance monitoring dashboard
   - Alert configuration
   - **Owner**: DevOps Engineer

### Short-term Goals (Week 3-6)

#### Feature Completion
1. **MyArtistsDashboard Polish**
   - Mobile responsiveness fixes
   - Performance optimization with virtualization
   - Enhanced error handling
   - **Owner**: Frontend Developer
   - **Timeline**: Week 3

2. **Advanced Search Implementation**
   - Location-based filtering
   - Date range selection
   - Genre hierarchy
   - **Owner**: Frontend Developer
   - **Timeline**: Week 4

3. **Spotify Catalog Import v2**
   - Production-ready batch processing
   - Progress tracking UI
   - Resume capability
   - **Owner**: Full-stack Developer
   - **Timeline**: Week 5-6

4. **Artist Mapping Enhancement**
   - Fuzzy matching algorithms
   - Admin interface for manual mapping
   - Confidence scoring system
   - **Owner**: Backend Developer
   - **Timeline**: Week 5-6

### Medium-term Goals (Month 2-3)

#### Advanced Features
1. **Setlist.fm Integration v2**
   - Post-show accuracy scoring
   - Historical analysis
   - Prediction algorithms
   - User accuracy leaderboards

2. **Social Features**
   - User profiles with voting history
   - Follow other users
   - Social voting feeds
   - Comment system on predictions

3. **Mobile App Development**
   - React Native implementation
   - Push notifications for followed artists
   - Offline voting capability
   - Location-based show recommendations

4. **Analytics Dashboard**
   - Admin panel for site metrics
   - User engagement analytics
   - Artist popularity trends
   - Revenue tracking (if monetized)

### Long-term Vision (Month 4-12)

#### Advanced Platform Features
1. **Machine Learning Integration**
   - Setlist prediction algorithms based on historical data
   - User preference learning
   - Venue-specific prediction models
   - Artist touring pattern analysis

2. **Monetization Features**
   - Premium user tiers
   - Artist promotion tools
   - Venue partnerships
   - Ticketing integration revenue share

3. **API Platform**
   - Public API for third-party developers
   - Webhook system for real-time data
   - Developer dashboard
   - Rate limiting and authentication

4. **International Expansion**
   - Multi-language support
   - Regional music service integrations
   - Local venue partnerships
   - Currency localization

### Technical Debt Reduction Plan

#### Code Quality Improvements
1. **Refactoring Priorities**
   - Extract common logic into shared utilities
   - Standardize error handling patterns
   - Implement consistent typing across codebase
   - Reduce component complexity (break down large components)

2. **Architecture Improvements**
   - Implement proper separation of concerns
   - Add dependency injection for services
   - Create standardized API response formats
   - Implement proper caching strategies

3. **Documentation Enhancement**
   - API documentation with OpenAPI/Swagger
   - Component storybook for UI library
   - Developer onboarding guide
   - Architecture decision records (ADRs)

### Success Metrics & KPIs

#### User Engagement Metrics
- Daily Active Users (DAU) target: 1,000+ within 3 months
- Average session duration: > 5 minutes
- Vote conversion rate: > 30% of visitors vote
- User retention: > 60% return within 7 days

#### Technical Performance Metrics
- Page load time: < 2 seconds for 95th percentile
- API response time: < 500ms for 95th percentile
- Error rate: < 0.1% for critical paths
- Uptime: > 99.9% monthly

#### Business Metrics
- Artist catalog coverage: > 10,000 artists within 6 months
- Show coverage: > 80% of major venue shows
- Prediction accuracy: > 40% songs correct per setlist
- User-generated content: > 1,000 setlists per month

### Risk Management & Mitigation

#### Technical Risks
1. **API Rate Limits**
   - Risk: External API quotas exceeded
   - Mitigation: Implement robust rate limiting and caching
   - Contingency: Multiple API keys, alternative data sources

2. **Database Performance**
   - Risk: Query performance degradation under load
   - Mitigation: Proper indexing, query optimization, read replicas
   - Contingency: Database scaling plan, connection pooling

3. **Real-time System Overload**
   - Risk: WebSocket connections exceed capacity
   - Mitigation: Connection limits, graceful degradation
   - Contingency: Polling fallback, horizontal scaling

#### Business Risks
1. **Data Quality Issues**
   - Risk: Poor artist mapping affects user experience
   - Mitigation: Robust validation, manual review process
   - Contingency: User reporting system, admin override tools

2. **Legal/Licensing Issues**
   - Risk: Copyright or data usage concerns
   - Mitigation: Proper attribution, fair use compliance
   - Contingency: Legal review, licensing agreements

3. **Competition**
   - Risk: Established players enter market
   - Mitigation: Focus on unique features, community building
   - Contingency: Pivot strategy, partnership opportunities

## Developer Resources & Documentation

### Code Organization & Conventions

#### File Structure Conventions
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Radix/shadcn)
│   ├── __tests__/      # Component tests
│   └── *.tsx           # Feature components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── services/           # Business logic and API calls
├── context/            # React context providers
├── utils/              # Pure utility functions
├── types/              # TypeScript type definitions
└── integrations/       # External service integrations
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `MyArtistsDashboard.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useRealtimeVoting.ts`)
- **Services**: camelCase (e.g., `spotifyService.ts`)
- **Types**: PascalCase with descriptive names (e.g., `SpotifyArtist`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_VOTES_PER_SHOW`)

#### Code Quality Standards
```typescript
// Example service module structure
// services/exampleService.ts
import { supabase } from '@/integrations/supabase/client';
import type { ExampleType } from '@/types/example';

/**
 * Service for handling example operations
 * Follows consistent error handling and caching patterns
 */
export class ExampleService {
  private static instance: ExampleService;
  
  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  async getData(id: string): Promise<ExampleType | null> {
    try {
      // Implementation with proper error handling
    } catch (error) {
      console.error('Error in ExampleService.getData:', error);
      throw new Error(`Failed to get data: ${error.message}`);
    }
  }
}
```

### API Integration Guidelines

#### External API Best Practices
1. **Rate Limiting**: Always implement proper rate limiting
2. **Error Handling**: Graceful degradation for API failures
3. **Caching**: Cache responses to reduce API calls
4. **Retries**: Exponential backoff for failed requests
5. **Monitoring**: Track API usage and performance

#### Supabase Integration Patterns
```typescript
// Proper Supabase query patterns
export async function getArtistWithShows(artistId: string) {
  const { data, error } = await supabase
    .from('artists')
    .select(`
      *,
      shows:shows(
        id,
        name,
        date,
        venues(name, city, state)
      )
    `)
    .eq('id', artistId)
    .order('date', { foreignTable: 'shows' });
    
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to fetch artist: ${error.message}`);
  }
  
  return data?.[0] || null;
}
```

### Testing Guidelines

#### Unit Testing Patterns
```typescript
// Example test structure
// __tests__/services/exampleService.test.ts
import { ExampleService } from '@/services/exampleService';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ExampleService', () => {
  let service: ExampleService;
  
  beforeEach(() => {
    service = ExampleService.getInstance();
    vi.clearAllMocks();
  });
  
  describe('getData', () => {
    it('should return data for valid ID', async () => {
      // Test implementation
    });
    
    it('should handle errors gracefully', async () => {
      // Error handling test
    });
  });
});
```

#### Component Testing Patterns
```typescript
// Example component test
// __tests__/components/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from '@/components/MyComponent';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

describe('MyComponent', () => {
  it('should render correctly', () => {
    const queryClient = createTestQueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Debugging & Troubleshooting

#### Common Issues & Solutions
1. **Real-time Connection Issues**
   - Check Supabase connection status
   - Verify RLS policies
   - Monitor WebSocket connection logs

2. **API Rate Limits**
   - Check service rate limiting implementation
   - Monitor API usage dashboard
   - Implement proper backoff strategies

3. **Database Performance Issues**
   - Analyze slow query logs
   - Check index usage
   - Monitor connection pool status

4. **Memory Leaks**
   - Use React DevTools Profiler
   - Check for unremoved event listeners
   - Verify useEffect cleanup functions

#### Development Tools
- **React DevTools**: Component debugging and profiling
- **Supabase Dashboard**: Database monitoring and queries
- **Vercel Analytics**: Performance monitoring
- **Browser DevTools**: Network monitoring and performance analysis

### Support Resources & Documentation

#### Internal Documentation
- **README.md**: Project overview and setup instructions
- **IMPLEMENTATION_REPORT.md**: Current feature implementation status
- **API Documentation**: Generated from code comments
- **Database Schema**: Visual diagrams in `docs/database/`

#### External Resources
- **React Query Documentation**: https://tanstack.com/query/latest
- **Supabase Documentation**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs

#### Community & Support
- **GitHub Issues**: Bug reports and feature requests
- **Discord Channel**: Real-time developer discussions
- **Stack Overflow**: Tagged questions for community help
- **Design System**: Figma workspace for UI/UX consistency

### Emergency Procedures

#### Production Incident Response
1. **Immediate Response** (0-15 minutes)
   - Assess severity and impact
   - Notify stakeholders via Slack/email
   - Begin investigation using monitoring tools

2. **Investigation** (15-60 minutes)
   - Check error tracking (Sentry)
   - Review application logs
   - Identify root cause
   - Implement temporary fixes if possible

3. **Resolution** (1-4 hours)
   - Deploy permanent fix
   - Verify resolution across all environments
   - Update stakeholders on resolution
   - Conduct post-mortem if critical

#### Rollback Procedures
```bash
# Quick rollback to previous deployment
vercel rollback --timeout 30s

# Database rollback (if migration issues)
supabase db reset --linked --include-seeds

# Cache invalidation (if needed)
# Contact Redis/CDN provider for manual cache clear
```

#### Contact Information

**Development Team**
- **Lead Developer**: [Name] - [email] - [phone] - Primary technical decisions
- **Frontend Lead**: [Name] - [email] - UI/UX and React issues
- **Backend Lead**: [Name] - [email] - Database and API issues
- **DevOps Engineer**: [Name] - [email] - Infrastructure and deployment

**Project Management**
- **Product Manager**: [Name] - [email] - Feature prioritization
- **Project Manager**: [Name] - [email] - Timeline and coordination
- **QA Lead**: [Name] - [email] - Testing and quality assurance

**Business Contacts**
- **Stakeholder**: [Name] - [email] - Business decisions
- **Legal**: [Name] - [email] - Compliance and licensing issues
- **Marketing**: [Name] - [email] - User acquisition and content

---

**Document Version**: 2.0  
**Last Updated**: May 27, 2025  
**Next Review Date**: June 27, 2025  
**Maintained By**: Development Team Lead
