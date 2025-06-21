# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


IMPORTANT: NEVER REPLY THAT THE APP IS FULLY COMPLETE AND FUNCTIONAL. STICK TO THE TODO LIST AND INSTRUCTIONS.MD FILE and implement it 100%

## Project Overview

TheSet is a crowdsourced concert setlist voting platform built as a Turborepo monorepo with Next.js frontend, Fastify/GraphQL backend, and Supabase for database and real-time features.

## Common Commands

### Development
```bash
# Start all development servers (web at :3000, API at :4000)
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

# Open Prisma Studio for database inspection
pnpm --filter @setlist/database studio

# Push schema changes (development only)
pnpm db:push

# Seed database with test data
pnpm db:seed

# Generate Prisma client
pnpm --filter @setlist/database generate
```

### Background Jobs & Sync
```bash
# Sync setlists from Setlist.fm API
pnpm sync:setlists

# Sync artist data from Spotify
pnpm --filter @setlist/api sync:spotify

# Calculate trending shows algorithm
pnpm --filter @setlist/api calculate:trending

# Refresh trending shows via Supabase function
pnpm refresh:trending

# Run all sync jobs in sequence
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