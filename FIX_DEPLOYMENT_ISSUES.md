# Fix Deployment Issues

## Issues Fixed

### 1. Database Connection Error
**Problem**: The database URL format was incorrect for Supabase
**Solution**: Updated to use the correct format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 2. Supabase Config Error
**Problem**: The config.toml had invalid function configuration
**Solution**: Removed the problematic function configuration section

## Steps to Deploy

### 1. Test Database Connection
```bash
./scripts/test-db-connection.sh
```

### 2. Run Migrations
```bash
./scripts/migrate-remote-db.sh
```

If you still get connection errors, try:
1. Check if the password is correct
2. Try using the connection string from Supabase Dashboard > Settings > Database
3. Use the "Session pooler" connection string if available

### 3. Deploy Edge Functions

First, link to your Supabase project:
```bash
cd supabase
supabase link --project-ref ailrmwtahifvstpfhbgn
```

Then set the secrets:
```bash
supabase secrets set CRON_SECRET=1234567890
supabase secrets set SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
supabase secrets set SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
supabase secrets set TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
supabase secrets set SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL
```

Deploy the functions:
```bash
cd functions
./deploy-all.sh
```

## Alternative Database Migration Approach

If migrations still fail, you can:

1. Go to Supabase Dashboard > SQL Editor
2. Run the schema creation manually:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create your tables here (copy from migration files)
```

## Troubleshooting

### Database Connection Issues
1. Verify the database password is correct
2. Check Supabase Dashboard > Settings > Database for connection strings
3. Try both "Transaction pooler" and "Session pooler" modes
4. Ensure your IP is not blocked by Supabase

### Edge Function Deployment Issues
1. Make sure you're logged in: `supabase login`
2. Verify you're linked to the project: `supabase status`
3. Check function syntax: `deno check supabase/functions/[function-name]/index.ts`
4. Deploy functions individually if batch deployment fails

## Next Steps After Successful Deployment

1. Configure cron schedules in Supabase Dashboard
2. Test each edge function manually
3. Deploy the web app to Vercel
4. Deploy the API to Railway
5. Update production environment variables