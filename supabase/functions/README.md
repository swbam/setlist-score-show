# Supabase Edge Functions

This directory contains the Edge Functions for TheSet application that handle background data synchronization and maintenance tasks.

## Functions

### sync-setlists
- **Purpose**: Synchronizes recent setlists from Setlist.fm API
- **Schedule**: Daily
- **Description**: Fetches setlists from the last 7 days for all artists in the database

### sync-spotify
- **Purpose**: Synchronizes artist song catalogs from Spotify
- **Schedule**: Daily
- **Description**: Updates song catalogs for artists that haven't been synced in 7 days

### calculate-trending
- **Purpose**: Calculates trending scores for upcoming shows
- **Schedule**: Every 4 hours
- **Description**: Updates trending scores based on views, votes, and proximity to show date

### sync-artists
- **Purpose**: Synchronizes upcoming shows from Ticketmaster
- **Schedule**: Every 6 hours
- **Description**: Fetches upcoming shows for artists that haven't been updated in 24 hours

### cleanup-old-data
- **Purpose**: Removes old and orphaned data
- **Schedule**: Weekly
- **Description**: Cleans up shows older than 6 months, orphaned records, and duplicate songs

## Deployment

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Set environment variables:
   ```bash
   supabase secrets set CRON_SECRET=your-secret
   supabase secrets set SPOTIFY_CLIENT_ID=your-id
   supabase secrets set SPOTIFY_CLIENT_SECRET=your-secret
   supabase secrets set TICKETMASTER_API_KEY=your-key
   supabase secrets set SETLISTFM_API_KEY=your-key
   ```

4. Deploy functions:
   ```bash
   supabase functions deploy
   ```

## Setting up Cron Jobs

After deploying the functions, set up cron jobs in Supabase Dashboard:

1. Go to Edge Functions in your Supabase Dashboard
2. For each function, click "Schedule"
3. Set the following schedules:
   - `sync-setlists`: `0 2 * * *` (Daily at 2 AM)
   - `sync-spotify`: `0 3 * * *` (Daily at 3 AM)
   - `calculate-trending`: `0 */4 * * *` (Every 4 hours)
   - `sync-artists`: `0 */6 * * *` (Every 6 hours)
   - `cleanup-old-data`: `0 4 * * 0` (Weekly on Sunday at 4 AM)

## Testing Functions Locally

1. Start local Supabase:
   ```bash
   supabase start
   ```

2. Serve functions locally:
   ```bash
   supabase functions serve
   ```

3. Test a function:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/sync-setlists' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json'
   ```

## Manual Execution

Functions can be manually triggered via HTTP POST:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME' \
  --header 'Authorization: Bearer YOUR_CRON_SECRET' \
  --header 'Content-Type: application/json'
```

## Monitoring

- Check function logs in Supabase Dashboard under Edge Functions > Logs
- Each function returns a JSON response with execution stats
- Failed operations are logged with error details

## Environment Variables

Required environment variables (set via `supabase secrets set`):

- `CRON_SECRET`: Secret for authenticating cron job requests
- `SPOTIFY_CLIENT_ID`: Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify app client secret
- `TICKETMASTER_API_KEY`: Ticketmaster API key
- `SETLISTFM_API_KEY`: Setlist.fm API key