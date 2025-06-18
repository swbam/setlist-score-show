# Active Context - TheSet Platform

## Current Work Focus

**Primary Objective**: Complete the critical fixes to take TheSet from 80% to 100% completion, with special focus on homepage revamp and search unification.

## Recent Changes & Current State

### Homepage Issues Identified
- Current homepage is only displaying basic components but not loading data correctly
- Homepage content query `getTopHomepageContent()` is failing - likely querying non-existent database views
- Design quality is significantly below target (described as "20% of needed quality")
- Need to display 20+ upcoming shows and top artists in the US
- Artist cards missing images
- No duplicate handling in place

### Search System Problems
- Multiple inconsistent search implementations throughout the app
- Search should be unified: artists by name, shows by zip code
- Results should display below input consistently
- Must integrate with existing sync/creation system

### Data Flow & Sync System Status
- Artist, show, venue, and song catalog sync system exists and works
- Supabase functions and cron jobs are implemented but need review
- Background job orchestration needs proper scheduling
- Real-time subscriptions have memory leak issues

## Next Steps Priority

1. **Database Views Fix**: Create proper homepage views for shows and artists
2. **Homepage Component Revamp**: Complete redesign with Apple-tier UI/UX
3. **Search Unification**: Single consistent search component
4. **Admin Panel**: API routes for manual sync triggering
5. **Performance Fixes**: Real-time memory leak cleanup

## Active Decisions & Considerations

### Design Philosophy
- Target: Apple-tier design quality and user experience
- Mobile-first, responsive across all devices
- Dark theme with gradient overlays and glassmorphism effects
- Consistent button styling and interactions

### Technical Patterns
- Using Supabase for data, Realtime for live updates
- Next.js 14 App Router architecture
- Turborepo monorepo structure maintained
- GraphQL + Fastify API layer

### Data Strategy
- Homepage should show only top US artists and shows
- Filter by popularity metrics and vote activity
- Group shows by date for better organization
- Implement proper caching for frequently accessed data

## Important Patterns & Preferences

### Component Structure
- Card-based layouts for shows and artists
- Gradient overlays for visual hierarchy
- Loading states and error boundaries everywhere
- Optimistic UI updates for voting

### Database Patterns
- Use RPC functions for complex queries
- Create materialized views for performance
- Proper indexing on frequently queried fields
- Foreign key relationships strictly maintained

### API Integration Patterns
- All external API calls go through sync system
- Data is imported to local database first
- Background jobs handle data freshness
- Rate limiting and error handling in place

## Current Challenges

1. **Homepage Data Loading**: Views/queries don't exist or are misconfigured
2. **Search Consistency**: Multiple search implementations causing confusion
3. **Real-time Performance**: Memory leaks in WebSocket subscriptions
4. **Admin Tooling**: Manual sync triggers needed for debugging
5. **Design Quality**: Current UI far below target standards

## Learnings & Project Insights

### What Works Well
- Database schema is solid and well-designed
- API integrations are functional
- Core voting system operates correctly
- Monorepo structure enables good code organization

### What Needs Improvement
- Frontend components need major quality upgrade
- Search UX is fragmented and confusing
- Background job scheduling is not automated
- Real-time subscriptions need proper cleanup
- Homepage is not production-ready

### Key Technical Insights
- Supabase views are critical for complex homepage queries
- Real-time subscriptions must have cleanup in useEffect returns
- GraphQL layer should handle all data fetching, not direct Supabase calls
- Admin functionality is essential for production debugging

## Environment & Context

- Turborepo monorepo with apps/web, apps/api, packages structure
- Vercel deployment for frontend, Railway for API
- Supabase for database, auth, and real-time features
- External APIs: Spotify, Ticketmaster, setlist.fm integration
