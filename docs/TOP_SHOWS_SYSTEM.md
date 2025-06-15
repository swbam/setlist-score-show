# Top Shows System

This document describes the automated top shows system that fetches and imports the most popular upcoming concerts from Ticketmaster API.

## Overview

The top shows system automatically:
1. Fetches the top 50 most relevant upcoming concerts in the US from Ticketmaster
2. Auto-imports new artists, venues, and shows into our database
3. Queues artists for Spotify sync to enrich data with songs and metadata
4. Updates the homepage and explore page with fresh, popular content
5. Runs every hour to keep data current

## Architecture

### Edge Function: `sync-top-shows`
- **Location**: `supabase/functions/sync-top-shows/index.ts`
- **Schedule**: Every hour (`0 * * * *`)
- **Purpose**: Fetch and import top shows from Ticketmaster API

### Database Changes
- Added `popularity` column to `shows` table
- Added `artist_sync_queue` table for managing Spotify sync jobs
- Updated queries to prioritize shows by popularity

### Frontend Updates
- Homepage now shows "Top Shows" instead of just upcoming shows
- Explore page "Upcoming" tab renamed to "Top Shows"
- Both pages query by popularity first, then date

## How It Works

### 1. Data Fetching
```typescript
// Ticketmaster API query parameters
{
  classificationName: 'Music',
  countryCode: 'US',
  size: '50',
  sort: 'relevance,desc', // Most popular first
  startDateTime: new Date().toISOString(),
  endDateTime: sixMonthsFromNow.toISOString()
}
```

### 2. Data Processing
For each event:
1. **Artist Processing**:
   - Check if artist exists (by name or Ticketmaster ID)
   - If new: create artist with high popularity (75)
   - Queue for Spotify sync if missing Spotify data

2. **Venue Processing**:
   - Check if venue exists (by Ticketmaster ID)
   - If new: create venue with location data

3. **Show Processing**:
   - Check if show exists (by Ticketmaster ID)
   - If new: create show with high popularity (75)
   - Create default setlist with popular songs (if available)

### 3. Data Enrichment
- Artists are automatically queued for Spotify sync
- Spotify sync adds songs, genres, and metadata
- Popular songs are added to default setlists

## Deployment

### Quick Deploy
```bash
./scripts/deploy-top-shows-system.sh
```

### Manual Steps
1. **Deploy Edge Function**:
   ```bash
   cd supabase/functions
   supabase functions deploy sync-top-shows
   ```

2. **Run Database Migrations**:
   ```bash
   supabase db push
   ```

3. **Set Up Cron Job** (in Supabase SQL Editor):
   ```sql
   -- Enable pg_cron extension
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   
   -- Set cron secret
   ALTER DATABASE postgres SET app.cron_secret = 'your-secret-here';
   
   -- Schedule hourly sync
   SELECT cron.schedule(
     'sync-top-shows',
     '0 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://your-project-id.supabase.co/functions/v1/sync-top-shows',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.cron_secret') || '"}'::jsonb
     ) as request_id;
     $$
   );
   ```

## Configuration

### Environment Variables
- `TICKETMASTER_API_KEY`: Your Ticketmaster API key
- `CRON_SECRET`: Secret for authenticating cron jobs
- `SUPABASE_ANON_KEY`: Supabase anonymous key

### Rate Limiting
- 200ms delay between processing events
- Respects Ticketmaster API rate limits
- Graceful error handling for API failures

## Monitoring

### Function Logs
```bash
supabase functions logs sync-top-shows
```

### Cron Job Status
```sql
SELECT * FROM cron.job WHERE jobname = 'sync-top-shows';
SELECT * FROM cron.job_run_details WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'sync-top-shows'
) ORDER BY start_time DESC LIMIT 10;
```

### Manual Testing
```bash
curl -X POST 'https://your-project-id.supabase.co/functions/v1/sync-top-shows' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Performance Metrics

### Expected Results Per Run
- **Events Processed**: ~50 top shows
- **New Artists**: 5-15 (varies by season)
- **New Shows**: 20-40 (after initial import)
- **New Venues**: 10-25 (varies by season)
- **Execution Time**: 30-60 seconds

### Database Impact
- Minimal storage growth (~1MB per run)
- Efficient queries with proper indexing
- Automatic cleanup of old data

## Benefits

### For Users
- Always see the most popular upcoming concerts
- Instant page loads (no live API calls)
- Rich data with artist info and songs
- Consistent, fresh content

### For System
- Reduced API calls during user browsing
- Better rate limit management
- Centralized data enrichment
- Scalable architecture

## Troubleshooting

### Common Issues

1. **Function Not Running**:
   - Check cron job is scheduled: `SELECT * FROM cron.job`
   - Verify cron secret is set
   - Check function logs for errors

2. **No New Data**:
   - Verify Ticketmaster API key is valid
   - Check API rate limits
   - Review function execution logs

3. **Spotify Sync Issues**:
   - Check `artist_sync_queue` table
   - Verify Spotify credentials
   - Monitor sync-spotify function logs

### Debug Queries
```sql
-- Check recent top shows
SELECT s.*, a.name as artist_name, v.name as venue_name 
FROM shows s
JOIN artists a ON s.artist_id = a.id
JOIN venues v ON s.venue_id = v.id
WHERE s.popularity > 50
ORDER BY s.created_at DESC
LIMIT 20;

-- Check sync queue status
SELECT * FROM artist_sync_queue 
WHERE sync_type = 'spotify' 
ORDER BY created_at DESC 
LIMIT 20;
```

## Future Enhancements

- Geographic filtering (user location-based)
- Genre-specific top shows
- Personalized recommendations
- Real-time popularity scoring
- Integration with ticket sales data 