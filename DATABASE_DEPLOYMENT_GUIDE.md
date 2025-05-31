# Database Migration Deployment Guide

## Overview
This guide outlines the steps to deploy all database migrations for the Setlist Score Show application.

## Prerequisites
- Supabase CLI installed and configured
- Access to production Supabase project
- Database backup completed

## Migration Files Status

### Core Schema Migrations
- ✅ `20240101000014_add_user_voting_stats_function.sql` - User voting statistics
- ✅ `20240101000015_add_trending_score_column.sql` - Trending score column
- ✅ `20250125_add_increment_show_views_function.sql` - Show view tracking
- ✅ `20250125_create_setlist_with_songs_function.sql` - Setlist creation

### Voting System Enhancements
- ✅ `20250526_add_get_user_vote_stats_function.sql` - User vote statistics
- ✅ `20250526_add_update_trending_shows_function.sql` - Trending updates
- ✅ `20250526_add_vote_limits.sql` - Vote limiting system
- ✅ `20250526_fix_vote_limits_schema.sql` - Vote limits schema fix
- ✅ `20250527015700_update_vote_for_song_with_limits.sql` - Enhanced voting

### Performance & Integration
- ✅ `20250527062700_add_ticketmaster_name_to_artists.sql` - Ticketmaster integration
- ✅ `20250527063100_add_performance_indexes.sql` - Performance indexes
- ✅ `20250527063200_add_trending_shows_materialized_view.sql` - Trending view
- ✅ `20250527064000_add_calculate_trending_scores_function.sql` - Trending calculation

## Deployment Steps

### 1. Pre-Deployment Checklist
```bash
# Verify Supabase CLI connection
supabase status

# Check current migration status
supabase db diff

# Create database backup
supabase db dump --data-only > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Deploy Migrations
```bash
# Navigate to project directory
cd /Users/seth/setlist-score-show-3

# Deploy all pending migrations
supabase db push

# Verify migration status
supabase migration list
```

### 3. Post-Deployment Verification
```bash
# Test database functions
supabase db test

# Verify materialized view
psql -h [HOST] -U [USER] -d [DB] -c "SELECT COUNT(*) FROM trending_shows;"

# Test trending calculation
psql -h [HOST] -U [USER] -d [DB] -c "SELECT calculate_trending_scores();"
```

### 4. Performance Validation
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- Verify materialized view refresh
SELECT refresh_trending_shows_materialized_view();

-- Test vote limits
SELECT * FROM get_user_vote_stats('test-user-id');
```

## Rollback Plan

### Emergency Rollback
```bash
# Restore from backup if needed
psql -h [HOST] -U [USER] -d [DB] < backup_[timestamp].sql

# Reset migrations (if necessary)
supabase db reset
```

### Selective Rollback
```sql
-- Drop specific functions if needed
DROP FUNCTION IF EXISTS calculate_trending_scores();
DROP MATERIALIZED VIEW IF EXISTS trending_shows;
```

## Monitoring

### Key Metrics to Monitor
- Migration execution time
- Database performance impact
- Function execution success rates
- Materialized view refresh times

### Health Checks
```sql
-- Verify all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- Check materialized view status
SELECT schemaname, matviewname, ispopulated 
FROM pg_matviews;
```

## Troubleshooting

### Common Issues
1. **Migration conflicts**: Check for duplicate function names
2. **Permission errors**: Verify database user permissions
3. **Performance impact**: Monitor query execution times

### Support Commands
```bash
# View migration logs
supabase logs

# Check database connections
supabase db inspect

# Reset local development
supabase db reset --local
```

## Success Criteria
- ✅ All migrations applied successfully
- ✅ No performance degradation
- ✅ All functions operational
- ✅ Materialized views populated
- ✅ Indexes created and utilized

## Next Steps
After successful deployment:
1. Update application configuration
2. Deploy application code
3. Run end-to-end tests
4. Monitor production metrics