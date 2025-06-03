-- Refresh materialized views
SELECT refresh_trending_shows();

-- Update show view counts from recent activity
UPDATE "Show" s
SET view_count = view_count + (
  SELECT COUNT(DISTINCT user_id)
  FROM "Vote" v
  WHERE v.show_id = s.id
    AND v.created_at > NOW() - INTERVAL '1 hour'
)
WHERE s.date >= NOW() - INTERVAL '30 days';

-- Clean up old sync history
DELETE FROM "SyncHistory"
WHERE created_at < NOW() - INTERVAL '30 days'
  AND status = 'completed';

-- Vacuum analyze for performance
VACUUM ANALYZE;