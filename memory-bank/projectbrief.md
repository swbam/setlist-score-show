# TheSet - Concert Setlist Voting Platform

## Project Overview

TheSet is a sophisticated concert setlist voting platform that allows music fans to vote on songs they want to hear at upcoming concerts and compare crowd-sourced predictions with actual performed setlists. The application integrates with Spotify, Ticketmaster, and setlist.fm APIs to create a comprehensive ecosystem for concert data and fan engagement.

## Core Vision

TheSet serves as a bridge between fans and live music experiences, creating an interactive platform where the music community can collectively influence and predict concert setlists. The platform operates autonomously by importing artist profiles from Spotify, concert data from Ticketmaster, and actual setlists from setlist.fm, creating a complete workflow from prediction to verification.

## Key Features

### Authentication & Personalization
- Spotify OAuth for personalized experience and top artist data
- Email-based authentication as fallback
- User dashboard showing followed artists and voting history

### Data Integration & Sync
- **Spotify Integration**: Artist profiles, song catalogs, user top artists
- **Ticketmaster Integration**: Concert/show data, venue information 
- **setlist.fm Integration**: Actual performed setlists for post-concert comparison

### Core Voting System
- Interactive setlist voting for upcoming shows
- Real-time vote updates via Supabase Realtime
- Optimistic UI for immediate feedback
- Automatic setlist seeding with 5 random songs from artist's catalog

### Discovery & Search
- Homepage with trending shows and top artists
- Unified search for artists and shows by location/zip code
- Artist profiles with upcoming shows
- Show pages with venue details and setlist voting

### Post-Concert Analysis
- Comparison between fan-voted setlists and actual performed setlists
- Accuracy scoring and prediction statistics
- Community leaderboards for prediction accuracy

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Fastify + GraphQL (Mercurius), Prisma ORM
- **Database**: PostgreSQL 15 via Supabase
- **Real-time**: Supabase Realtime WebSockets
- **Authentication**: Supabase Auth with Spotify OAuth
- **Caching**: Redis for API responses
- **External APIs**: Spotify Web API, Ticketmaster Discovery API, setlist.fm API
- **Infrastructure**: Vercel (frontend), Railway (API), Supabase (database)
- **Monorepo**: Turborepo with pnpm workspaces

## Current Status
The application is approximately 80% complete with:
- ✅ Database schema and relationships established
- ✅ API integrations implemented
- ✅ Core voting functionality working
- ✅ Background sync jobs created
- ❌ Homepage design and data display needs major revamp
- ❌ Search functionality needs unification
- ❌ Background job orchestration needs setup
- ❌ Real-time memory leaks need fixing

## Critical Priorities
1. **Homepage Revamp**: Complete redesign with proper data loading and Apple-tier UI/UX
2. **Search Unification**: Single consistent search experience throughout app
3. **Data Sync Orchestration**: Proper scheduling of background jobs
4. **Performance Optimization**: Fix real-time memory leaks and optimize queries

## API Credentials
- Spotify Client ID: 2946864dc822469b9c672292ead45f43
- Spotify Client Secret: feaf0fc901124b839b11e02f97d18a8d
- Ticketmaster API Key: k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
