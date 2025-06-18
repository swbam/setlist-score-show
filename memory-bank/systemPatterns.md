# System Patterns - TheSet Architecture

## Database Architecture

### Core Schema Relationships
```
Artists (1) -> (M) Shows
Artists (1) -> (M) Songs  
Shows (1) -> (1) Setlists
Shows (M) -> (1) Venues
Setlists (1) -> (M) SetlistSongs
SetlistSongs (M) -> (1) Songs
Users (1) -> (M) Votes
Votes (M) -> (1) SetlistSongs
Shows (1) -> (0..1) PlayedSetlists (post-concert)
PlayedSetlists (1) -> (M) PlayedSetlistSongs
```

### Key Tables Structure
- **Artists**: Spotify ID as PK, metadata, popularity scores
- **Shows**: Ticketmaster ID as PK, date, status, venue/artist FKs
- **Songs**: Spotify track IDs, artist relationship, popularity
- **Setlists**: One per show, contains voted songs
- **SetlistSongs**: Junction with vote counts and positions
- **Votes**: Individual user votes, one per user per song
- **PlayedSetlists**: Actual performed setlists from setlist.fm

### Data Flow Patterns

#### Sync & Import Pipeline
1. **Spotify API** → Artist profiles + song catalogs → Database
2. **Ticketmaster API** → Show/venue data → Database  
3. **setlist.fm API** → Actual setlists → Database (post-show)

#### User Interaction Flow
1. User search/browse → Show discovery
2. Show page load → Auto-create setlist if none exists
3. User voting → Real-time updates via Supabase Realtime
4. Post-show → Compare predicted vs actual setlists

## Component Architecture Patterns

### Page Structure
```
app/
├── (main)/
│   ├── page.tsx              # Homepage with trending content
│   ├── artists/
│   │   ├── page.tsx          # Artist search/browse
│   │   └── [id]/
│   │       └── page.tsx      # Artist profile + shows
│   ├── shows/
│   │   ├── page.tsx          # Show search/browse
│   │   └── [id]/
│   │       └── page.tsx      # Show voting page
│   └── my-artists/
│       └── page.tsx          # User's followed artists
```

### Component Hierarchy
```
Layout
├── Header (search, auth)
├── Navigation
└── Page Content
    ├── Hero/Banner
    ├── Content Sections
    │   ├── Cards (Artist/Show)
    │   ├── Lists
    │   └── Voting Interface
    └── Footer
```

## API & Data Patterns

### GraphQL Schema Organization
```
apps/api/src/schema/
├── artist.graphql
├── show.graphql  
├── song.graphql
├── setlist.graphql
├── vote.graphql
└── user.graphql
```

### Resolver Patterns
- **Queries**: Data fetching with filtering, pagination
- **Mutations**: Voting, user actions, admin operations
- **Subscriptions**: Real-time vote updates, presence

### Supabase Integration Patterns
- **RPC Functions**: Complex queries (homepage content, trending)
- **Row Level Security**: User data protection
- **Realtime**: WebSocket subscriptions for live updates
- **Edge Functions**: Background sync jobs

## Real-time Update Patterns

### Vote Updates
```typescript
// Subscribe to setlist changes
const channel = supabase
  .channel(`setlist:${showId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public', 
    table: 'setlist_songs'
  }, handleVoteUpdate)
  .subscribe()

// Optimistic updates
const handleVote = async (songId) => {
  // Update UI immediately
  updateVoteCount(songId, +1)
  
  // Send to server
  const { error } = await voteForSong(songId)
  
  // Revert on error
  if (error) updateVoteCount(songId, -1)
}
```

### Memory Management
- Always unsubscribe in useEffect cleanup
- Use AbortController for fetch cancellation
- Implement proper loading/error states

## Background Job Patterns

### Sync Job Architecture
```
supabase/functions/
├── sync-homepage-orchestrator/    # Master coordinator
├── sync-ticketmaster-shows/       # Show data updates
├── sync-spotify-catalog/          # Artist songs
├── refresh-trending-shows/        # Calculate trends
└── sync-setlists/                 # Import actual setlists
```

### Scheduling Patterns
- **Hourly**: Trending calculations, vote analytics
- **Every 6 hours**: Show data refresh, venue updates  
- **Daily**: Artist catalog sync, setlist imports
- **Weekly**: Full metadata refresh

### Error Handling
- Retry logic with exponential backoff
- Dead letter queues for failed jobs
- Comprehensive logging and monitoring
- Graceful degradation on API failures

## Search & Discovery Patterns

### Unified Search Architecture
```typescript
interface SearchResult {
  type: 'artist' | 'show' | 'venue'
  id: string
  name: string
  metadata: object
  relevanceScore: number
}
```

### Search Implementation
- **Artist Search**: Name, genre, popularity-weighted
- **Location Search**: Zip code → nearby venues → shows
- **Fuzzy Matching**: Typo tolerance, partial matches
- **Result Ranking**: Popularity + recency + user preference

## UI/UX Patterns

### Design System
- **Colors**: Dark theme with accent gradients
- **Typography**: Clean, hierarchical font sizing
- **Spacing**: Consistent 4px/8px grid system
- **Components**: shadcn/ui base + custom variants

### Interaction Patterns
- **Cards**: Hover effects, click targets, loading states
- **Buttons**: Consistent styling, disabled states, loading indicators
- **Forms**: Validation, error handling, optimistic updates
- **Navigation**: Breadcrumbs, back buttons, deep linking

### Responsive Design
- **Mobile-first**: Touch targets, swipe gestures
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Grid Systems**: CSS Grid + Flexbox for layouts
- **Images**: Responsive with proper aspect ratios

## Performance Patterns

### Caching Strategy
- **API Responses**: Redis for frequently accessed data
- **Database Queries**: Materialized views for complex aggregations
- **Static Assets**: CDN for images, fonts, icons
- **Client State**: React Query for data synchronization

### Optimization Techniques
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component
- **Database Indexing**: Proper indices on query columns
- **Bundle Analysis**: Regular size monitoring

## Security Patterns

### Authentication Flow
1. Spotify OAuth → Supabase session
2. JWT tokens for API authentication
3. Row-level security for data access
4. Role-based permissions (user/admin)

### Data Protection
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent abuse of voting/search
- **CORS Configuration**: Restrict cross-origin requests
- **Environment Variables**: Secure API key management

## Error Handling Patterns

### Frontend Error Boundaries
```typescript
class ErrorBoundary extends Component {
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('Error caught:', error, errorInfo)
  }
}
```

### API Error Standards
```typescript
interface APIError {
  code: string
  message: string
  details?: object
  timestamp: string
}
```

### Graceful Degradation
- Show skeleton states during loading
- Fallback content when APIs fail
- Offline-capable where possible
- Clear error messages for users
