# **CRITICAL FIXES REQUIRED - IMMEDIATE ACTION PLAN**

Version: 2025-06-03  
Status: **🚨 BLOCKING - Cannot run or deploy app**  
Priority: **Fix build system first, then core functionality**

## **🔴 BLOCKER #1: Turbo Configuration (Fix NOW)**

The app cannot run, build, or test due to outdated Turbo configuration.

### **Fix turbo.json immediately:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["NODE_ENV", "NEXT_PUBLIC_*", "DATABASE_URL"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Action:** Update turbo.json NOW to unblock all development.

## **🔴 BLOCKER #2: Environment Setup**

### **Create .env files with correct values:**

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://ailrmwtahifvstpfhbgn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
NEXT_PUBLIC_API_URL=http://localhost:4000

# apps/api/.env
DATABASE_URL=postgresql://postgres.ailrmwtahifvstpfhbgn:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.ailrmwtahifvstpfhbgn:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true
SUPABASE_URL=https://ailrmwtahifvstpfhbgn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_KEY]
REDIS_URL=redis://localhost:6379
SPOTIFY_CLIENT_ID=[YOUR_SPOTIFY_ID]
SPOTIFY_CLIENT_SECRET=[YOUR_SPOTIFY_SECRET]
SETLIST_FM_API_KEY=[YOUR_SETLIST_KEY]
```

## **🟡 CRITICAL #3: Get App Running Locally**

### **Step-by-step commands:**

```bash
# 1. Fix Turbo config (see above)

# 2. Install dependencies
pnpm install

# 3. Start Docker services
docker-compose up -d

# 4. Run database migrations
cd packages/database
pnpm prisma migrate deploy
pnpm prisma generate

# 5. Seed initial data
pnpm db:seed

# 6. Start development servers
cd ../..
pnpm dev
```

## **🟡 CRITICAL #4: Fix Show Voting (Core Feature)**

### **Consolidate to single working implementation:**

1. **Delete all duplicate voting files:**
   ```bash
   rm src/pages/ShowVoting/ShowVotingFixed.tsx
   rm src/pages/ShowVoting/ShowVotingOptimized.tsx
   rm src/pages/ShowVoting/ShowVotingEnhanced.tsx
   rm src/hooks/useRealtimeVotingFixed.ts
   rm src/hooks/useRealtimeVotingMemoryFixed.ts
   rm src/hooks/useVoteTrackingFixed.ts
   ```

2. **Use single canonical implementation:**
   - Keep only `/app/(main)/shows/[id]/page.tsx`
   - Use single `useRealtimeVoting` hook
   - Test thoroughly for memory leaks

## **🟡 CRITICAL #5: Complete Migration**

### **Move legacy code:**

```bash
# 1. Create legacy directory
mkdir -p apps/web-legacy

# 2. Move old React/Vite code
mv src/* apps/web-legacy/
mv index.html apps/web-legacy/
mv vite.config.ts apps/web-legacy/
mv public/* apps/web/public/

# 3. Update imports in Next.js app
# Change all imports from /src to proper Next.js structure
```

## **🟡 CRITICAL #6: Deploy to Production**

### **Deployment sequence:**

1. **Deploy database migrations:**
   ```bash
   export DATABASE_URL=[PRODUCTION_URL]
   cd packages/database
   pnpm prisma migrate deploy
   ```

2. **Deploy Supabase Edge Functions:**
   ```bash
   cd supabase/functions
   ./deploy-all.sh
   ```

3. **Deploy API to Railway:**
   ```bash
   railway up --service api
   ```

4. **Deploy Web to Vercel:**
   ```bash
   cd apps/web
   vercel --prod
   ```

## **📊 Success Criteria**

### **Phase 1 (Today):**
- [ ] Turbo config fixed
- [ ] `pnpm dev` runs without errors
- [ ] Can access app at localhost:3000
- [ ] Can access API at localhost:4000/graphql

### **Phase 2 (This Week):**
- [ ] Show voting works with real-time updates
- [ ] No memory leaks in Chrome DevTools
- [ ] All duplicate code removed
- [ ] Legacy code moved to web-legacy

### **Phase 3 (Next Week):**
- [ ] Deployed to production
- [ ] All environment variables configured
- [ ] Edge functions running on schedule
- [ ] Monitoring set up

## **🚀 Quick Test After Each Fix**

```bash
# Test 1: Can build?
pnpm build

# Test 2: Can run tests?
pnpm test

# Test 3: Can start dev?
pnpm dev

# Test 4: Voting works?
# 1. Go to http://localhost:3000
# 2. Find a show
# 3. Vote on songs
# 4. Open in another browser - see real-time updates?

# Test 5: No memory leaks?
# 1. Open Chrome DevTools > Memory
# 2. Take heap snapshot
# 3. Vote 10 times
# 4. Take another snapshot
# 5. Compare - memory should not grow significantly
```

## **⚠️ DO NOT:**
- Start new features until core is working
- Add more duplicate implementations
- Mix architectural patterns
- Deploy without testing locally first

## **✅ DO:**
- Fix one thing at a time
- Test after each fix
- Commit working code frequently
- Ask for help if stuck

This plan prioritizes unblocking development and getting core functionality working. Everything else can wait.