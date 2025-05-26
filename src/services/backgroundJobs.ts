
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import { syncTrendingShows } from "@/services/sync/trendingSync";
import { getUnifiedArtistId } from "@/services/mappingService";

/**
 * Background job scheduler and execution service
 * Handles periodic data synchronization
 */

export interface JobResult {
  success: boolean;
  message: string;
  processingTime: number;
  recordsProcessed?: number;
}

/**
 * Daily artist sync job - updates artist metadata and catalogs
 */
export async function runDailyArtistSync(): Promise<JobResult> {
  const startTime = Date.now();
  let processed = 0;
  
  try {
    console.log('Starting daily artist sync job...');
    
    // Get artists that need updates (older than 7 days or never synced)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: artistsToUpdate, error } = await supabase
      .from('artists')
      .select('id, name, last_synced_at')
      .or(`last_synced_at.is.null,last_synced_at.lt.${sevenDaysAgo.toISOString()}`)
      .limit(50); // Limit to prevent timeout
    
    if (error) {
      throw new Error(`Failed to fetch artists: ${error.message}`);
    }
    
    if (!artistsToUpdate || artistsToUpdate.length === 0) {
      return {
        success: true,
        message: 'No artists need updating',
        processingTime: Date.now() - startTime,
        recordsProcessed: 0
      };
    }
    
    // Update each artist
    for (const artist of artistsToUpdate) {
      try {
        // Update artist metadata from Spotify
        const spotifyArtist = await spotifyService.getArtist(artist.id);
        if (spotifyArtist) {
          await spotifyService.storeArtistInDatabase(spotifyArtist);
          
          // Import catalog if needed
          await spotifyService.importArtistCatalog(artist.id);
          processed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error updating artist ${artist.id}:`, error);
      }
    }
    
    const processingTime = Date.now() - startTime;
    const message = `Updated ${processed}/${artistsToUpdate.length} artists`;
    
    console.log(`Daily artist sync completed: ${message} in ${processingTime}ms`);
    
    return {
      success: true,
      message,
      processingTime,
      recordsProcessed: processed
    };
  } catch (error) {
    console.error('Error in daily artist sync:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * 6-hour show data refresh job
 */
export async function runShowDataRefresh(): Promise<JobResult> {
  const startTime = Date.now();
  let processed = 0;
  
  try {
    console.log('Starting show data refresh job...');
    
    // Get shows in the next 30 days that need updates
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    
    const { data: showsToUpdate, error } = await supabase
      .from('shows')
      .select(`
        id,
        artists!fk_shows_artist_id (name)
      `)
      .gte('date', today.toISOString())
      .lte('date', futureDate.toISOString())
      .limit(100);
    
    if (error) {
      throw new Error(`Failed to fetch shows: ${error.message}`);
    }
    
    if (!showsToUpdate || showsToUpdate.length === 0) {
      return {
        success: true,
        message: 'No shows need updating',
        processingTime: Date.now() - startTime,
        recordsProcessed: 0
      };
    }
    
    // Update show data from Ticketmaster
    for (const show of showsToUpdate) {
      try {
        const artist = show.artists as any;
        if (artist?.name) {
          const events = await ticketmasterService.getArtistEvents(artist.name);
          const matchingEvent = events.find(e => e.id === show.id);
          
          if (matchingEvent) {
            const venue = matchingEvent._embedded?.venues?.[0];
            const attraction = matchingEvent._embedded?.attractions?.[0];
            
            if (venue && attraction) {
              // Get unified artist ID
              const artistId = await getUnifiedArtistId(attraction.id, attraction.name);
              
              if (artistId) {
                await ticketmasterService.storeVenueInDatabase(venue);
                await ticketmasterService.storeShowInDatabase(matchingEvent, artistId, venue.id);
                processed++;
              }
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error updating show ${show.id}:`, error);
      }
    }
    
    const processingTime = Date.now() - startTime;
    const message = `Refreshed ${processed}/${showsToUpdate.length} shows`;
    
    console.log(`Show data refresh completed: ${message} in ${processingTime}ms`);
    
    return {
      success: true,
      message,
      processingTime,
      recordsProcessed: processed
    };
  } catch (error) {
    console.error('Error in show data refresh:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Hourly trending calculation job
 */
export async function runTrendingCalculation(): Promise<JobResult> {
  const startTime = Date.now();
  
  try {
    console.log('Starting trending calculation job...');
    
    // Run trending shows sync
    const result = await syncTrendingShows();
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Trending calculation completed in ${processingTime}ms`);
    
    return {
      success: result.success,
      message: result.message,
      processingTime,
      recordsProcessed: (result.data as any)?.processed || 0
    };
  } catch (error) {
    console.error('Error in trending calculation:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Run all background jobs in sequence
 */
export async function runAllBackgroundJobs(): Promise<{
  artistSync: JobResult;
  showRefresh: JobResult;
  trendingCalc: JobResult;
}> {
  console.log('Running all background jobs...');
  
  const artistSync = await runDailyArtistSync();
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  
  const showRefresh = await runShowDataRefresh();
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  
  const trendingCalc = await runTrendingCalculation();
  
  console.log('All background jobs completed');
  
  return {
    artistSync,
    showRefresh,
    trendingCalc
  };
}

/**
 * Initialize background job scheduler
 */
export function initializeBackgroundJobs(): void {
  // In a production environment, these would be handled by Vercel Cron Jobs
  // For now, we'll set up simple intervals for development
  
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
  
  console.log('Background job scheduler initialized');
}
