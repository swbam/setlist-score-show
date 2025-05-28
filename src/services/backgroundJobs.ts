import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import { syncTrendingShows } from "@/services/sync/trendingSync";
import { getUnifiedArtistId } from "@/services/mappingService";
import { DatabaseManager } from "@/services/databaseManager";
import { cacheService } from "@/services/cacheService";
import { errorHandler } from "@/services/errorHandling";
import { importPlayedSetlist } from './setlistfm';
import { getArtistEvents, storeVenueInDatabase, storeShowInDatabase } from './ticketmaster';

/**
 * Background job scheduler and execution service
 * Handles periodic data synchronization with enhanced monitoring
 */

export interface JobResult {
  success: boolean;
  message: string;
  processingTime: number;
  recordsProcessed?: number;
  errorDetails?: string;
  retryCount?: number;
}

export interface JobMetrics {
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  lastRunTimes: Record<string, Date>;
  errorCounts: Record<string, number>;
}

class EnhancedJobRunner {
  private jobMetrics: JobMetrics = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    avgProcessingTime: 0,
    lastRunTimes: {},
    errorCounts: {}
  };

  private readonly maxRetries = 3;
  private readonly retryDelayMs = 30000; // 30 seconds
  
  async executeWithRetry<T>(
    jobName: string,
    jobFunction: () => Promise<T>,
    context: Record<string, any> = {}
  ): Promise<JobResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${jobName}] Attempt ${attempt}/${this.maxRetries}`);
        
        const result = await jobFunction();
        const processingTime = Date.now() - startTime;
        
        // Update metrics
        this.jobMetrics.totalJobs++;
        this.jobMetrics.successfulJobs++;
        this.jobMetrics.lastRunTimes[jobName] = new Date();
        this.updateAvgProcessingTime(processingTime);
        
        console.log(`[${jobName}] Completed successfully in ${processingTime}ms`);
        
        return {
          success: true,
          message: `Job completed successfully${attempt > 1 ? ` after ${attempt} attempts` : ''}`,
          processingTime,
          recordsProcessed: typeof result === 'object' && result && 'recordsProcessed' in result 
            ? (result as any).recordsProcessed : undefined,
          retryCount: attempt - 1
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[${jobName}] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[${jobName}] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          console.error(`[${jobName}] All ${this.maxRetries} attempts failed`);
        }
      }
    }
    
    // All retries failed
    const processingTime = Date.now() - startTime;
    this.jobMetrics.totalJobs++;
    this.jobMetrics.failedJobs++;
    this.jobMetrics.errorCounts[jobName] = (this.jobMetrics.errorCounts[jobName] || 0) + 1;
    this.updateAvgProcessingTime(processingTime);
    
    return {
      success: false,
      message: `Job failed after ${this.maxRetries} attempts`,
      processingTime,
      errorDetails: lastError?.message || 'Unknown error',
      retryCount: this.maxRetries
    };
  }

  private updateAvgProcessingTime(processingTime: number): void {
    const currentAvg = this.jobMetrics.avgProcessingTime;
    const totalJobs = this.jobMetrics.totalJobs;
    
    this.jobMetrics.avgProcessingTime = 
      (currentAvg * (totalJobs - 1) + processingTime) / totalJobs;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics(): JobMetrics {
    return { ...this.jobMetrics };
  }

  resetMetrics(): void {
    this.jobMetrics = {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      avgProcessingTime: 0,
      lastRunTimes: {},
      errorCounts: {}
    };
  }
}

const jobRunner = new EnhancedJobRunner();

/**
 * Enhanced daily artist sync job with comprehensive error handling
 */
export async function runDailyArtistSync(): Promise<JobResult> {
  return jobRunner.executeWithRetry('dailyArtistSync', async () => {
    const syncStartTime = Date.now();
    let processedCount = 0;

    // Get artists that need syncing (not synced in last 24 hours)
    const { data: artists, error } = await supabase
      .from('artists')
      .select('id, name, last_synced_at')
      .or('last_synced_at.is.null,last_synced_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50); // Process in batches

    if (error) throw error;

    const results = [];
    for (const artist of artists || []) {
      try {
        // Sync with external services - artist.id is the Spotify ID
        if (artist.id) {
          const spotifyData = await spotifyService.getArtist(artist.id);
          if (spotifyData) {
            await supabase
              .from('artists')
              .update({
                name: spotifyData.name,
                image_url: spotifyData.images?.[0]?.url,
                genres: spotifyData.genres,
                popularity: spotifyData.popularity,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', artist.id);
            
            processedCount++;
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to sync artist ${artist.id}:`, error);
        // Continue with other artists
      }
    }

    // Invalidate artist cache
    cacheService.invalidatePattern('artist:*');

    return {
      recordsProcessed: processedCount,
      totalArtists: artists?.length || 0,
      processingTimeMs: Date.now() - syncStartTime
    };
  }, {
    operation: 'dailyArtistSync'
  });
}

/**
 * Enhanced trending calculation with performance monitoring
 */
export async function runTrendingCalculation(): Promise<JobResult> {
  return jobRunner.executeWithRetry('trendingCalculation', async () => {
    const startTime = Date.now();
    
    // Use the enhanced trending calculation
    const result = await DatabaseManager.executeStoredProcedure('calculate_trending_scores');
    
    // Update cache
    cacheService.invalidatePattern('trending:*');
    
    // Get count of updated shows
    const { count } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .gt('trending_score', 0);

    return {
      recordsProcessed: count || 0,
      processingTimeMs: Date.now() - startTime,
      result
    };
  });
}

/**
 * Enhanced show data refresh with better error handling
 */
export async function runShowDataRefresh(): Promise<JobResult> {
  return jobRunner.executeWithRetry('showDataRefresh', async () => {
    const startTime = Date.now();
    
    // Sync trending shows
    const trendingResult = await syncTrendingShows();
    
    // Update vote counts and statistics
    await DatabaseManager.executeMaintenanceQuery(`
      UPDATE shows 
      SET vote_count = (
        SELECT COUNT(*) 
        FROM votes v 
        JOIN setlist_songs ss ON v.setlist_song_id = ss.id 
        WHERE ss.show_id = shows.id
      ),
      updated_at = NOW()
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Clean up old cache entries
    cacheService.invalidatePattern('show:*');
    
    const processingTime = Date.now() - startTime;
    
    return {
      recordsProcessed: (trendingResult.data as any)?.processed || 0,
      processingTimeMs: processingTime,
      trendingResult
    };
  });
}

/**
 * New cache maintenance job
 */
export async function runCacheMaintenance(): Promise<JobResult> {
  return jobRunner.executeWithRetry('cacheMaintenance', async () => {
    const startTime = Date.now();
    
    const initialStats = cacheService.getStats();
    
    // Clear expired entries and optimize
    let cleanedEntries = 0;
    
    // Clean voting cache (most frequent updates)
    if (initialStats.voting.usage > 80) {
      const { votingCache } = await import('./cacheService');
      cleanedEntries += votingCache.size();
      votingCache.clear();
    }
    
    // Clean old user cache entries
    cleanedEntries += cacheService.invalidatePattern('user:stats:.*');
    
    const finalStats = cacheService.getStats();
    
    return {
      recordsProcessed: cleanedEntries,
      processingTimeMs: Date.now() - startTime,
      initialCacheSize: Object.values(initialStats).reduce((sum, stat) => sum + stat.size, 0),
      finalCacheSize: Object.values(finalStats).reduce((sum, stat) => sum + stat.size, 0)
    };
  });
}

/**
 * Database maintenance job
 */
export async function runDatabaseMaintenance(): Promise<JobResult> {
  return jobRunner.executeWithRetry('databaseMaintenance', async () => {
    const startTime = Date.now();
    
    // Clean up old sessions
    await DatabaseManager.executeMaintenanceQuery(`
      DELETE FROM sessions 
      WHERE expires_at < NOW() - INTERVAL '7 days'
    `);
    
    // Update user statistics
    await DatabaseManager.executeMaintenanceQuery(`
      SELECT update_all_user_stats()
    `);
    
    // Vacuum analyze for performance
    await DatabaseManager.executeMaintenanceQuery('VACUUM ANALYZE votes');
    await DatabaseManager.executeMaintenanceQuery('VACUUM ANALYZE setlist_songs');
    
    return {
      processingTimeMs: Date.now() - startTime,
      maintenanceTasks: ['cleanup_sessions', 'update_user_stats', 'vacuum_analyze']
    };
  });
}

/**
 * Health check job to monitor system status
 */
export async function runHealthCheck(): Promise<JobResult> {
  return jobRunner.executeWithRetry('healthCheck', async () => {
    const startTime = Date.now();
    const healthStatus: any = {};
    
    // Check database connectivity
    try {
      const isHealthy = await DatabaseManager.healthCheck();
      healthStatus.database = isHealthy ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthStatus.database = 'unhealthy';
      healthStatus.databaseError = error instanceof Error ? error.message : String(error);
    }
    
    // Check cache performance
    const cacheStats = cacheService.getStats();
    healthStatus.cache = {
      status: Object.values(cacheStats).every(stat => stat.usage < 90) ? 'healthy' : 'warning',
      stats: cacheStats
    };
    
    // Check job performance
    const jobMetrics = jobRunner.getMetrics();
    const successRate = jobMetrics.totalJobs > 0 
      ? (jobMetrics.successfulJobs / jobMetrics.totalJobs) * 100 
      : 100;
    
    healthStatus.jobs = {
      status: successRate > 80 ? 'healthy' : successRate > 50 ? 'warning' : 'unhealthy',
      successRate: Math.round(successRate),
      metrics: jobMetrics
    };
    
    // Check error rates
    const errorStats = errorHandler.getErrorStats();
    healthStatus.errors = {
      status: errorStats.lastHour < 10 ? 'healthy' : errorStats.lastHour < 50 ? 'warning' : 'unhealthy',
      stats: errorStats
    };
    
    // Overall status
    const componentStatuses = [
      healthStatus.database === 'healthy',
      healthStatus.cache.status === 'healthy',
      healthStatus.jobs.status === 'healthy',
      healthStatus.errors.status === 'healthy'
    ];
    
    const healthyComponents = componentStatuses.filter(Boolean).length;
    healthStatus.overall = healthyComponents === 4 ? 'healthy' : 
                          healthyComponents >= 3 ? 'warning' : 'unhealthy';
    
    // Log health status in production
    if (process.env.NODE_ENV === 'production') {
      console.log('System Health Check:', JSON.stringify(healthStatus, null, 2));
    }
    
    return {
      processingTimeMs: Date.now() - startTime,
      healthStatus
    };
  });
}

/**
 * Import setlists job for shows that have occurred recently
 */
export async function runImportSetlists(): Promise<JobResult> {
  return jobRunner.executeWithRetry('importSetlists', async () => {
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    // Find shows that have occurred recently (last 24-48 hours) without imported setlists
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Get shows that already have imported setlists
    const { data: importedShowIds, error: importedError } = await supabase
      .from('played_setlists')
      .select('show_id');

    if (importedError) throw importedError;

    const showIdsToExclude = importedShowIds?.map(ps => ps.show_id) || [];
    
    const { data: showsToImport, error: showsError } = await supabase
      .from('shows')
      .select('id, name, date')
      .gte('date', twoDaysAgo.toISOString().split('T')[0])
      .lte('date', new Date().toISOString().split('T')[0])
      .not('id', 'in', `(${showIdsToExclude.join(',')})`)
      .order('date', { ascending: true })
      .limit(10); // Process 10 shows per run

    if (showsError) throw showsError;

    if (!showsToImport || showsToImport.length === 0) {
      return {
        recordsProcessed: 0,
        processingTimeMs: Date.now() - startTime,
        message: 'No shows to import setlists for'
      };
    }

    for (const show of showsToImport) {
      try {
        await importPlayedSetlist(show.id);
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Error importing setlist for show ${show.id}:`, error);
      }
    }

    return {
      recordsProcessed: successCount,
      processingTimeMs: Date.now() - startTime,
      successCount,
      failureCount,
      totalShows: showsToImport.length
    };
  });
}

/**
 * Sync shows job to fetch new shows from Ticketmaster
 */
export async function runSyncShows(): Promise<JobResult> {
  return jobRunner.executeWithRetry('syncShows', async () => {
    const startTime = Date.now();
    let showsProcessed = 0;
    let showsStored = 0;

    // Fetch artists to sync shows for
    const { data: artistsToSync, error: artistsError } = await supabase
      .from('artists')
      .select('id, name')
      .order('last_synced_at', { ascending: false, nullsFirst: false })
      .limit(5); // Process 5 artists per run

    if (artistsError) throw artistsError;

    if (!artistsToSync || artistsToSync.length === 0) {
      return {
        recordsProcessed: 0,
        processingTimeMs: Date.now() - startTime,
        message: 'No artists to sync shows for'
      };
    }

    for (const artist of artistsToSync) {
      const tmSearchName = artist.name;
      if (!tmSearchName) continue;

      const events = await getArtistEvents(tmSearchName);

      for (const event of events) {
        showsProcessed++;
        const venueData = event._embedded?.venues?.[0];
        const attractionData = event._embedded?.attractions?.[0];

        if (!venueData || !attractionData) {
          console.warn(`Event ${event.id} for ${tmSearchName} is missing venue or attraction data. Skipping.`);
          continue;
        }

        // Store venue
        const venueStored = await storeVenueInDatabase(venueData);
        if (!venueStored) {
          console.warn(`Failed to store venue ${venueData.id} for event ${event.id}. Skipping show storage.`);
          continue;
        }

        // Store show
        const showStored = await storeShowInDatabase(event, artist.id, venueData.id);
        if (showStored) {
          showsStored++;
        }
      }
    }

    return {
      recordsProcessed: showsStored,
      processingTimeMs: Date.now() - startTime,
      showsProcessed,
      showsStored,
      artistsProcessed: artistsToSync.length
    };
  });
}

/**
 * Export job metrics for monitoring
 */
export function getJobMetrics(): JobMetrics {
  return jobRunner.getMetrics();
}

/**
 * Reset job metrics (for testing or periodic reset)
 */
export function resetJobMetrics(): void {
  jobRunner.resetMetrics();
}

/**
 * Enhanced job scheduler with health monitoring
 */
export function initializeJobScheduler() {
  console.log('Initializing enhanced background job scheduler...');

  // Run trending calculation every hour
  setInterval(() => {
    runTrendingCalculation().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
  
  // Run show refresh every 6 hours
  setInterval(() => {
    runShowDataRefresh().catch(console.error);
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  // Run artist sync daily
  setInterval(() => {
    runDailyArtistSync().catch(console.error);
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Run import setlists every 6 hours
  setInterval(() => {
    runImportSetlists().catch(console.error);
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Run sync shows every 12 hours
  setInterval(() => {
    runSyncShows().catch(console.error);
  }, 12 * 60 * 60 * 1000); // 12 hours

  // Run cache maintenance every 4 hours
  setInterval(() => {
    runCacheMaintenance().catch(console.error);
  }, 4 * 60 * 60 * 1000); // 4 hours

  // Run database maintenance daily at 2 AM
  const scheduleDbMaintenance = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(2, 0, 0, 0); // 2 AM
    
    if (target <= now) {
      target.setDate(target.getDate() + 1); // Next day if 2 AM has passed
    }
    
    const timeUntilTarget = target.getTime() - now.getTime();
    
    setTimeout(() => {
      runDatabaseMaintenance().catch(console.error);
      
      // Schedule next day
      setInterval(() => {
        runDatabaseMaintenance().catch(console.error);
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilTarget);
  };
  
  scheduleDbMaintenance();

  // Run health check every 15 minutes
  setInterval(() => {
    runHealthCheck().catch(console.error);
  }, 15 * 60 * 1000); // 15 minutes

  // Run initial health check
  setTimeout(() => {
    runHealthCheck().catch(console.error);
  }, 5000); // 5 seconds after startup

  console.log('Enhanced background job scheduler initialized with monitoring');
}
