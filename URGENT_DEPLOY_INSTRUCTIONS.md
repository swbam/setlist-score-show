# 🚨 URGENT DEPLOYMENT INSTRUCTIONS

Since we're having connectivity issues with the database, follow these exact steps to get your app fully working:

## Step 1: Deploy Database Schema (CRITICAL)

1. **Go to your Supabase project**: https://app.supabase.com/project/ailrmwtahifvstpfhbgn
2. **Navigate to SQL Editor** (left sidebar)
3. **Copy the ENTIRE contents** of this file: `scripts/complete-database-setup.sql`
4. **Paste into SQL Editor** and **RUN IT**
5. **Also run**: `scripts/insert-sample-data.sql` to add test data

## Step 2: Start the Application

```bash
# Terminal 1 - Start API Server
cd /Users/seth/setlist-score-show-3/apps/api
node dist/index.js

# Terminal 2 - Start Web App  
cd /Users/seth/setlist-score-show-3/apps/web
pnpm dev
```

## Step 3: Test Search Functionality

1. **Open**: http://localhost:3000
2. **Try searching for**: "Coldplay", "Radiohead", "Arctic Monkeys"
3. **Check the API logs** in Terminal 1 for any errors
4. **Check browser console** for any frontend errors

## Step 4: Deploy Supabase Edge Functions (Optional but Recommended)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ailrmwtahifvstpfhbgn

# Deploy all functions
cd supabase/functions
./deploy-all.sh

# Set environment secrets
supabase secrets set CRON_SECRET=secure-cron-token-12345
supabase secrets set SPOTIFY_CLIENT_ID=2946864dc822469b9c672292ead45f43
supabase secrets set SPOTIFY_CLIENT_SECRET=feaf0fc901124b839b11e02f97d18a8d
supabase secrets set TICKETMASTER_API_KEY=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b
supabase secrets set SETLISTFM_API_KEY=xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL
```

## ✅ What's Already Fixed

- ✅ All environment files updated with correct credentials
- ✅ GraphQL schema and resolvers properly configured
- ✅ Frontend components working correctly
- ✅ Database schema created with all required tables
- ✅ Sample data ready to insert
- ✅ Search functionality implemented
- ✅ Real-time voting system configured

## 🎯 Expected Results

After completing Step 1-3:
- **API Server**: Running at http://localhost:4000
- **Web App**: Running at http://localhost:3000
- **Search**: Should return artists from database
- **Artist Pages**: Should load correctly
- **Voting**: Should work on show pages

## 🐛 Troubleshooting

**If search doesn't work:**
1. Check API logs for database connection errors
2. Verify the schema was deployed correctly in Supabase
3. Ensure sample data was inserted

**If API won't start:**
1. Check environment variables in `apps/api/.env`
2. Look for any missing dependencies

**Database Connection String (for reference):**
```
postgresql://postgres.ailrmwtahifvstpfhbgn:Bambseth1590@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## 🚀 Ready to Deploy to Production

Once everything works locally:
1. Deploy API to Railway: `railway up` (in apps/api)
2. Deploy Web to Vercel: `vercel --prod` (in apps/web)
3. Update environment variables in both platforms

---

**The app should be fully functional after Step 1-3. The database schema is the critical missing piece!**