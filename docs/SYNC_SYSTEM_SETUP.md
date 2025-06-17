# Sync System Setup & Admin Guide

## Overview

This document explains how to set up and use the enhanced sync system for TheSet application, including the new admin controls and improved data population features.

## System Components

### Backend Sync Functions

1. **sync-top-shows** - Fetches trending shows from Ticketmaster and creates default setlists with Spotify top tracks
2. **sync-artists** - Comprehensive show sync for existing artists plus discovery of new trending artists
3. **sync-spotify** - Syncs artist catalogs from Spotify API
4. **calculate-trending** - Refreshes the trending shows materialized view
5. **refresh_trending_shows** - Alternative trending calculation function
6. **sync-setlists** - Imports actual setlists from Setlist.fm

### Admin Features

- Admin control panel in user profile page
- Manual trigger buttons for each sync function
- Real-time status updates and error reporting
- Admin-only access via role-based authentication

## Setup Instructions

### 1. Environment Variables

Set these environment variables in your Supabase project:

**Edge Functions Environment Variables** (Dashboard > Settings > Edge Functions):
```
CRON_SECRET=your-secure-random-secret-here
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
TICKETMASTER_API_KEY=your-ticketmaster-api-key
SETLIST_FM_API_KEY=your-setlistfm-api-key
```

### 2. Database Configuration

Run the migration to set up cron jobs:
```sql
-- Apply the cron job configuration
-- This will be done automatically via migrations
```

### 3. Admin User Setup

To grant admin access to a user:

```sql
-- Replace 'user-id-here' with the actual user ID
UPDATE users 
SET role = 'admin' 
WHERE id = 'user-id-here';
```

### 4. Cron Job Configuration

The system automatically sets up cron jobs that run:
- **sync-artists**: Every 6 hours
- **calculate-trending**: Every 4 hours  
- **sync-setlists**: Daily at 2 AM
- **sync-spotify**: Daily at 3 AM
- **sync-top-shows**: Daily at 1 AM
- **cleanup-old-data**: Weekly on Sunday at 4 AM

## How the Enhanced Sync System Works

### 1. Top Shows Sync (sync-top-shows)

**What it does:**
- Fetches top 50 upcoming music events from Ticketmaster nationwide
- Creates artist records with Spotify IDs when possible
- Creates venue records with location data
- Creates show records with proper relationships
- **NEW**: Creates default setlists with 5-10 songs from artist's Spotify top tracks
- **NEW**: Automatically populates songs table with Spotify metadata

**Data Flow:**
1. Fetch events from Ticketmaster API
2. For each event, extract artist and venue information
3. Search for artist on Spotify to get `spotify_id`
4. Create artist record (if new) with Spotify integration
5. Create venue record (if new) with geolocation data
6. Create show record linking artist and venue
7. Create default setlist for the show
8. Fetch artist's top tracks from Spotify API
9. Create song records for tracks (if they don't exist)
10. Link songs to setlist via `setlist_songs` table

**Key Improvements:**
- Shows now have voteable content immediately after creation
- Songs include Spotify metadata (popularity, duration, preview URLs)
- Proper error handling and rate limiting
- Comprehensive logging and statistics

### 2. Artist Sync (sync-artists)

**Two-Phase Process:**

**Phase 1: Existing Artists**
- Updates shows for artists already in the database
- Prioritizes popular artists
- Uses direct Ticketmaster artist ID lookup when available
- Falls back to name-based search with exact matching

**Phase 2: Trending Discovery**
- Searches major markets (NYC, LA, Chicago, etc.) for popular events
- Discovers new trending artists automatically
- Creates artist records for newly discovered talent
- Focuses on relevance-sorted events

### 3. Spotify Integration (sync-spotify)

**Enhanced Catalog Sync:**
- Fetches complete artist catalogs (albums, singles, compilations)
- Stores track metadata including popularity and audio features
- Handles rate limiting and error recovery
- Deduplicates tracks across multiple albums
- Updates `last_synced_at` timestamps for tracking

### 4. Admin Controls

**Profile Page Integration:**
- Admin section only visible to users with `role = 'admin'`
- Manual trigger buttons for each sync function
- Real-time loading states and progress feedback
- Success/error message display
- Secure authentication using JWT tokens

**Security Features:**
- Dual authentication: CRON_SECRET for automated runs, JWT tokens for manual triggers
- Admin role verification for all manual operations
- CORS headers properly configured
- Input validation and error handling

## Usage Guide

### For Administrators

1. **Access Admin Controls**:
   - Log in with an admin account
   - Navigate to your profile page
   - Scroll down to see the "Admin Controls" section

2. **Manual Sync Operations**:
   - Click any sync button to trigger that operation
   - Monitor the status messages below each button
   - Operations run in real-time and show progress

3. **Recommended Sync Order for Initial Setup**:
   1. Sync Top Shows (populates initial data)
   2. Sync Artists (fills in more shows)
   3. Sync Spotify (adds song catalogs)
   4. Calculate Trending (updates trending algorithm)

### For Developers

**Testing Sync Functions Locally:**
```bash
# Use the test script
./scripts/test-sync-top-shows.sh

# Or manually with curl
curl -X POST "${SUPABASE_URL}/functions/v1/sync-top-shows" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
```

**Monitoring Sync Performance:**
- Check Edge Function logs in Supabase Dashboard
- Monitor database growth and query performance
- Watch for rate limiting issues with external APIs

## Data Flow Summary

```
Ticketmaster API → Artists + Shows + Venues
                      ↓
Spotify API → Artist Spotify IDs + Top Tracks → Songs
                      ↓
Database → Shows with Setlists containing Songs
                      ↓
Trending Algorithm → Trending Shows View
                      ↓
Frontend → Voteable Content for Users
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" Errors**:
   - Verify CRON_SECRET is set correctly
   - Check user has admin role in database
   - Ensure JWT token is valid

2. **Spotify API Errors**:
   - Verify Spotify credentials are set
   - Check for rate limiting (429 errors)
   - Ensure proper token refresh handling

3. **Empty Setlists**:
   - Check if artist has `spotify_id`
   - Verify Spotify top tracks API is working
   - Look for rate limiting or API quota issues

4. **Sync Timeouts**:
   - Edge functions have 25-second timeout
   - Large sync operations may need chunking
   - Monitor API rate limits

### Performance Optimization

- Sync functions include proper rate limiting
- Database queries use appropriate indexes
- Batch operations for bulk inserts
- Error recovery and partial success handling

## Monitoring & Maintenance

### Key Metrics to Watch

1. **Sync Success Rates**: Check function logs for errors
2. **Data Growth**: Monitor database size and query performance  
3. **API Usage**: Track external API calls and quotas
4. **User Engagement**: Monitor voting activity on generated content

### Regular Maintenance

- Review and clean up old sync logs
- Monitor external API quota usage
- Update Spotify/Ticketmaster credentials as needed
- Check trending algorithm performance

## Future Enhancements

Potential improvements to consider:

1. **Intelligent Setlist Prediction**: Use ML to predict better default setlists
2. **Real-time Sync Triggers**: Webhook-based updates from external APIs
3. **Advanced Analytics**: Detailed sync performance metrics
4. **User Preferences**: Personalized content discovery
5. **Geographic Targeting**: Location-based sync prioritization