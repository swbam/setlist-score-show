# Manual Database Setup Instructions

Since we're having connection issues with the Supabase CLI, please follow these manual steps to set up your database:

## 1. Access Supabase Dashboard

1. Go to: https://app.supabase.com/project/ailrmwtahifvstpfhbgn
2. Navigate to the **SQL Editor** in the left sidebar

## 2. Run the Complete Database Setup

1. Open the SQL Editor
2. Copy the entire contents of `/scripts/complete-database-setup.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

This script will:
- Create all necessary tables
- Set up indexes for performance
- Enable Row Level Security (RLS)
- Create policies for data access
- Add some test data to get started

## 3. Deploy Edge Functions

After the database is set up, deploy the Edge Functions:

```bash
cd supabase/functions
supabase link --project-ref ailrmwtahifvstpfhbgn
./deploy-all.sh
```

## 4. Set Edge Function Secrets

In the Supabase Dashboard, go to **Edge Functions** > **Secrets** and add:

```
CRON_SECRET=1234567890
SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL
```

## 5. Configure Cron Jobs

In the Supabase Dashboard, go to **Edge Functions** and set up these cron schedules:

- `sync-setlists`: Daily at 2 AM UTC
- `sync-spotify`: Daily at 3 AM UTC
- `calculate-trending`: Every 4 hours
- `sync-artists`: Every 6 hours
- `cleanup-old-data`: Weekly on Sunday

## 6. Update Environment Variables

Make sure your `.env` files have the correct database URL:

```bash
DATABASE_URL=postgresql://postgres.ailrmwtahifvstpfhbgn:Bambseth1590@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## 7. Verify Setup

Test the connection from your local environment:

```bash
cd apps/api
pnpm prisma db pull
```

This should show all the tables we just created.

## Next Steps

Once the database is set up:
1. Start the development servers: `pnpm dev`
2. Test the app at http://localhost:3000
3. Deploy to production using the deployment script

## Troubleshooting

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify all environment variables are set correctly
3. Ensure RLS policies are enabled on all tables
4. Check that the auth.users table exists (created by Supabase Auth)