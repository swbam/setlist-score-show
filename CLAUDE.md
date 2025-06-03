# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on localhost:5173
- `npm run build` - Production build 
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint with TypeScript rules

### Testing
- `npx playwright test` - Run e2e tests (uses baseURL localhost:8080)
- `npx playwright test --ui` - Run tests with UI mode
- `npx playwright test --headed` - Run tests in headed mode

### Data Management
- `npm run import-data` - Manual data import script using tsx

## Architecture Overview

**Application Type**: React SPA with Supabase backend - crowdsourced concert setlist voting platform

**Key Technologies**:
- Frontend: React 18 + TypeScript, Vite, TanStack React Query, Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Realtime), Vercel serverless functions
- External APIs: Spotify, Ticketmaster, Setlist.fm

**Data Flow**: External APIs → Cron Jobs → Supabase → React Query Cache → React Components

## Key Architecture Patterns

### File Organization
- `src/pages/` - Route components (main app pages)
- `src/components/` - Reusable UI components (uses shadcn/ui)
- `src/services/` - Business logic and external API calls  
- `src/hooks/` - Custom React hooks for state management
- `src/integrations/supabase/` - Database client and type definitions
- `api/cron/` - Background sync jobs (trending, imports, sync)

### State Management Strategy
- **React Query** for all server state (with aggressive caching)
- **React Context** for auth state (`AuthContext`) and mobile detection (`MobileContext`)
- **Local state** with useState for component-specific UI state

### Database Schema (Core Tables)
- `artists`, `venues`, `shows` - Concert data from external APIs
- `songs` - Artist catalogs from Spotify
- `setlists`, `setlist_songs` - User-generated setlists with vote counts
- `votes` - User voting records
- `users` - Auth and profiles

### Real-time Features
- Uses Supabase subscriptions for live vote updates
- Optimistic UI updates for immediate feedback
- Centralized realtime connection management in hooks

### Data Consistency Patterns
- Centralized API service (`src/services/api.ts`) coordinates all operations
- Data consistency service ensures referential integrity
- Background jobs maintain data freshness with external APIs

## TypeScript Configuration

Uses path aliases: `@/*` maps to `./src/*`

Relaxed TypeScript settings:
- `noImplicitAny: false`
- `strictNullChecks: false` 
- `noUnusedLocals: false`

## Testing Setup

E2E tests use Playwright with config in `playwright.config.ts`:
- Tests in `./e2e/` directory
- Expects dev server on localhost:8080 (not 5173)
- Screenshots/videos on failure for debugging

## External API Integration

### Rate Limiting & Sync
- Spotify API: Production rate limiter with exponential backoff
- Background sync jobs run via Vercel cron
- Import services handle large-scale data operations

### Environment Variables
Required for external APIs (Spotify, Ticketmaster, Setlist.fm) and Supabase connection.