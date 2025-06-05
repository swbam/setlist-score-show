# **SETLIST SCORE SHOW - FINAL IMPLEMENTATION PLAN**

Version: 2025-06-03  
Status: **CRITICAL - App in Transitional State**  
Priority: **Complete Migration & Fix Core Features**

## **🚨 EXECUTIVE SUMMARY**

The app is currently in a **hybrid state** between the old React/Vite architecture and the new Next.js/Turbo monorepo. While the infrastructure from TheSet-Fixes.md is mostly implemented, the actual app functionality is fragmented across multiple implementations. This plan focuses on completing the migration and getting the app to a fully working production state.

### **Current State:**
- ✅ Database schema complete
- ✅ Monorepo structure set up
- ⚠️ Mixed React/Vite + Next.js codebase
- ⚠️ Multiple conflicting implementations
- ❌ App not fully functional

### **Target State:**
- Single Next.js 14 app with App Router
- Unified API approach
- Working real-time voting
- Production-ready deployment

## **📋 PRIORITY TASK LIST**

### **Phase 1: Complete Next.js Migration (Week 1)**

#### **1.1 Consolidate App Entry Points**
```bash
# Current issue: Multiple entry points
# - /src/main.tsx (Vite)
# - /app/layout.tsx (Next.js)
# - index.html (Vite)
```

**Tasks:**
1. **Move all React components from `/src` to `/app`**
   - [ ] Create mapping of all components in `/src/components`
   - [ ] Move and adapt each component to Next.js patterns
   - [ ] Update imports to use `@/components` alias
   - [ ] Remove `/src` directory completely

2. **Consolidate routing**
   - [ ] Map all routes from `/src/pages` to `/app/(main)` structure
   - [ ] Implement proper Next.js layouts
   - [ ] Add loading.tsx and error.tsx boundaries
   - [ ] Remove React Router dependencies

3. **Update configuration**
   - [ ] Remove Vite files (vite.config.ts, index.html)
   - [ ] Update package.json scripts to only use Next.js
   - [ ] Ensure all environment variables work with Next.js

#### **1.2 Fix Component Architecture**

**Current Issues:**
- Duplicate components (e.g., VoteButton in multiple locations)
- Inconsistent imports
- Mixed styling approaches

**Tasks:**
1. **Component consolidation checklist:**
   ```
   /src/components/voting/VoteButton.tsx → /components/voting/VoteButton.tsx
   /src/components/EnhancedVotingSection.tsx → REMOVE (use VotingSection)
   /src/components/VotingInterface.tsx → MERGE into /components/voting/VotingSection.tsx
   /src/components/ShowCardEnhanced.tsx → UPDATE /components/shows/ShowCard.tsx
   ```

2. **Update all imports:**
   ```typescript
   // Before
   import { VoteButton } from '../src/components/voting/VoteButton'
   
   // After
   import { VoteButton } from '@/components/voting/VoteButton'
   ```

### **Phase 2: Fix Real-time Voting (Week 1-2)**

#### **2.1 Consolidate Real-time Hooks**

**Current Issues:**
- Multiple versions: useRealtimeVoting, useRealtimeVotingFixed, useRealtimeVotingMemoryFixed
- Memory leaks
- Inconsistent state updates

**Solution - Single Unified Hook:**
```typescript
// hooks/useRealtimeVoting.ts
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeVoting(showId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    let channel: RealtimeChannel | null = null
    
    const setupChannel = async () => {
      // Clean up any existing channel
      const existingChannel = supabase.channel(`show:${showId}`)
      await supabase.removeChannel(existingChannel)
      
      // Create new channel
      channel = supabase.channel(`show:${showId}`, {
        config: {
          presence: { key: 'voting' }
        }
      })
      
      // Listen to vote changes
      channel
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `show_id=eq.${showId}`
        }, (payload) => {
          // Update React Query cache
          queryClient.setQueryData(['show', showId], (old: any) => {
            if (!old) return old
            // Update logic here
            return updateShowData(old, payload.new)
          })
        })
        .subscribe()
    }
    
    setupChannel()
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [showId, queryClient])
}
```

**Tasks:**
1. [ ] Delete all duplicate real-time hooks
2. [ ] Implement single useRealtimeVoting hook
3. [ ] Update all components to use new hook
4. [ ] Add proper error handling and reconnection logic
5. [ ] Test memory leaks with Chrome DevTools

#### **2.2 Fix Vote State Management**

**Current Issues:**
- Vote counts not updating properly
- User vote state not persisting
- Race conditions

**Solution:**
```typescript
// hooks/useVoting.ts
export function useVoting(showId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  
  // Track user's votes for this show
  const { data: userVotes } = useQuery({
    queryKey: ['userVotes', showId, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      const { data } = await supabase
        .from('votes')
        .select('setlist_song_id')
        .eq('user_id', session.user.id)
        .eq('show_id', showId)
      return data?.map(v => v.setlist_song_id) || []
    },
    enabled: !!session?.user?.id
  })
  
  const vote = useMutation({
    mutationFn: async (setlistSongId: string) => {
      // API call to vote
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries(['userVotes', showId])
      queryClient.invalidateQueries(['show', showId])
    }
  })
  
  return {
    vote,
    hasVoted: (setlistSongId: string) => userVotes?.includes(setlistSongId) || false,
    votesRemaining: 10 - (userVotes?.length || 0)
  }
}
```

### **Phase 3: Unify API Approach (Week 2)**

#### **3.1 Choose Single API Strategy**

**Current State:**
- GraphQL with Mercurius
- tRPC implementation
- Direct Supabase calls
- Supabase Edge Functions

**Recommendation: Keep GraphQL as primary API**
- Already fully implemented
- Better for complex queries
- Good developer experience

**Tasks:**
1. [ ] Remove tRPC implementation
2. [ ] Move Supabase Edge Functions logic to GraphQL resolvers
3. [ ] Create GraphQL client with proper typing
4. [ ] Update all data fetching to use GraphQL

#### **3.2 Implement Proper Data Fetching**

```typescript
// lib/graphql-client.ts
import { GraphQLClient } from 'graphql-request'
import { getSession } from '@/lib/auth'

export async function getGraphQLClient() {
  const session = await getSession()
  
  return new GraphQLClient(process.env.NEXT_PUBLIC_API_URL + '/graphql', {
    headers: {
      authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
  })
}

// Example query hook
export function useShow(showId: string) {
  return useQuery({
    queryKey: ['show', showId],
    queryFn: async () => {
      const client = await getGraphQLClient()
      return client.request(GET_SHOW_QUERY, { showId })
    }
  })
}
```

### **Phase 4: Core Features Fix (Week 2-3)**

#### **4.1 Show Voting Page**

**File:** `/app/(main)/shows/[id]/page.tsx`

**Current Issues:**
- Not using real-time updates properly
- Vote state not managed correctly
- UI not reflecting teal gradient theme

**Complete Implementation:**
```typescript
export default function ShowVotingPage({ params }: { params: { id: string } }) {
  const { data: show, isLoading } = useShow(params.id)
  const { vote, hasVoted, votesRemaining } = useVoting(params.id)
  useRealtimeVoting(params.id) // Enable real-time updates
  
  if (isLoading) return <ShowPageSkeleton />
  if (!show) return <NotFound />
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-white">{show.artist.name}</h1>
          <p className="text-xl text-white/90">{show.venue.name}</p>
          <p className="text-white/80">{formatDate(show.date)}</p>
        </div>
      </div>
      
      {/* Voting Section */}
      <div className="container mx-auto p-6">
        <VotingSection 
          show={show}
          onVote={vote}
          hasVoted={hasVoted}
          votesRemaining={votesRemaining}
        />
      </div>
      
      {/* Live Activity */}
      <LiveActivityIndicator showId={params.id} />
    </div>
  )
}
```

#### **4.2 Search & Discovery**

**Current Issues:**
- Search not working properly
- No autocomplete
- Poor performance

**Tasks:**
1. [ ] Implement proper search with PostgreSQL full-text search
2. [ ] Add search suggestions using pg_trgm
3. [ ] Cache search results in Redis
4. [ ] Add filters (date, location, genre)

#### **4.3 Artist Pages**

**File:** `/app/(main)/artists/[slug]/page.tsx`

**Tasks:**
1. [ ] Show upcoming shows for artist
2. [ ] Display artist stats
3. [ ] Link to Spotify/Apple Music
4. [ ] Show voting history

### **Phase 5: Production Readiness (Week 3)**

#### **5.1 Performance Optimization**

1. **Database Optimization**
   - [ ] Verify all indexes are being used
   - [ ] Add query result caching
   - [ ] Optimize trending calculation
   - [ ] Add connection pooling

2. **Frontend Optimization**
   - [ ] Implement proper code splitting
   - [ ] Add image optimization
   - [ ] Enable ISR for static pages
   - [ ] Add proper caching headers

3. **Real-time Optimization**
   - [ ] Implement exponential backoff for reconnections
   - [ ] Add connection state indicators
   - [ ] Batch updates to prevent UI thrashing

#### **5.2 Error Handling & Monitoring**

1. **Error Boundaries**
   ```typescript
   // app/(main)/error.tsx
   'use client'
   
   export default function Error({
     error,
     reset,
   }: {
     error: Error & { digest?: string }
     reset: () => void
   }) {
     useEffect(() => {
       // Log to error reporting service
       console.error(error)
     }, [error])
   
     return (
       <div className="flex min-h-screen items-center justify-center">
         <div className="text-center">
           <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
           <button
             onClick={reset}
             className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
           >
             Try again
           </button>
         </div>
       </div>
     )
   }
   ```

2. **Monitoring Setup**
   - [ ] Add Sentry for error tracking
   - [ ] Implement performance monitoring
   - [ ] Add uptime monitoring
   - [ ] Create health check endpoints

#### **5.3 Security Audit**

1. **Authentication**
   - [ ] Verify all routes are properly protected
   - [ ] Add rate limiting to all endpoints
   - [ ] Implement CSRF protection
   - [ ] Add request validation

2. **Database Security**
   - [ ] Review all RLS policies
   - [ ] Add SQL injection tests
   - [ ] Verify user data isolation
   - [ ] Add audit logging

### **Phase 6: Deployment (Week 3-4)**

#### **6.1 Environment Setup**

1. **Production Environment Variables**
   ```env
   # Database
   DATABASE_URL=
   DIRECT_URL=
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   
   # External APIs
   SPOTIFY_CLIENT_ID=
   SPOTIFY_CLIENT_SECRET=
   SETLIST_FM_API_KEY=
   TICKETMASTER_API_KEY=
   
   # Redis
   REDIS_URL=
   
   # Monitoring
   SENTRY_DSN=
   ```

2. **Deployment Configuration**
   - [ ] Set up Vercel for Next.js app
   - [ ] Configure Railway for API
   - [ ] Set up GitHub Actions for CI/CD
   - [ ] Configure automatic deployments

#### **6.2 Migration Steps**

1. **Database Migration**
   ```bash
   # 1. Backup current database
   pg_dump $OLD_DATABASE_URL > backup.sql
   
   # 2. Run migrations
   pnpm db:migrate
   
   # 3. Verify data integrity
   pnpm db:verify
   ```

2. **Zero-Downtime Deployment**
   - [ ] Deploy new version to staging
   - [ ] Run smoke tests
   - [ ] Switch traffic gradually
   - [ ] Monitor for errors
   - [ ] Complete switchover

### **Phase 7: Post-Launch (Week 4+)**

#### **7.1 Bug Fixes & Iterations**
- Monitor error logs
- Fix critical bugs immediately
- Gather user feedback
- Plan feature improvements

#### **7.2 Feature Enhancements**
1. **Social Features**
   - Share setlists
   - Follow other users
   - Comments on shows

2. **Artist Features**
   - Artist dashboard
   - Analytics
   - Direct fan engagement

3. **Advanced Voting**
   - Weighted voting for premium users
   - Prediction contests
   - Historical setlist data

## **🚀 QUICK WINS (Can Do Now)**

1. **Fix Navigation**
   ```typescript
   // components/layout/Header.tsx
   // Add proper navigation with teal gradient
   ```

2. **Fix Vote Button**
   ```typescript
   // components/voting/VoteButton.tsx
   // Ensure proper optimistic updates
   ```

3. **Add Loading States**
   ```typescript
   // Create consistent loading skeletons
   ```

4. **Fix Mobile Experience**
   ```typescript
   // Ensure all components are mobile-responsive
   ```

## **📊 SUCCESS METRICS**

- [ ] All pages load in < 2 seconds
- [ ] Real-time updates work within 100ms
- [ ] Zero memory leaks
- [ ] 99.9% uptime
- [ ] < 1% error rate
- [ ] Mobile-first responsive design

## **⚠️ CRITICAL PATHS**

1. **Must complete Next.js migration first** - nothing else will work properly until this is done
2. **Real-time voting is core feature** - must work flawlessly
3. **Data integrity** - no lost votes, accurate counts
4. **Performance** - app must feel instant

## **🛠️ DEVELOPER CHECKLIST**

Before marking any task complete:
- [ ] Feature works in development
- [ ] Tests written and passing
- [ ] No console errors
- [ ] Works on mobile
- [ ] Real-time updates working
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Accessibility checked

This plan prioritizes getting the app to a fully functional state by completing the migration and fixing core features. The hybrid architecture must be resolved before adding new features.