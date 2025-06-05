# Deploy Database Schema to Supabase

Since we're having connection issues with psql, follow these steps to deploy the database schema manually:

## Step 1: Deploy Database Schema

1. Go to your Supabase project: https://app.supabase.com/project/ailrmwtahifvstpfhbgn
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/complete-database-setup.sql` into the SQL editor
4. Click **Run** to execute the schema

## Step 2: Deploy Edge Functions

1. Make sure you have Supabase CLI installed: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link to your project: `supabase link --project-ref ailrmwtahifvstpfhbgn`
4. Deploy all functions: `cd supabase/functions && ./deploy-all.sh`

## Step 3: Set Environment Secrets

Run these commands to set environment secrets for Edge Functions:

```bash
supabase secrets set CRON_SECRET=secure-cron-token-12345
supabase secrets set SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
supabase secrets set SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
supabase secrets set TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
supabase secrets set SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL
```

## Step 4: Insert Sample Data

After the schema is deployed, run:
```bash
psql "your-connection-string" -f scripts/insert-sample-data.sql
```

Or copy the contents of `scripts/insert-sample-data.sql` and run in Supabase SQL Editor.

## Step 5: Test the Application

Once everything is deployed:
1. Start the API server: `pnpm --filter @setlist/api dev`
2. Start the web app: `pnpm --filter @setlist/web dev`
3. Test the search functionality

The application should now be fully functional with the remote database!