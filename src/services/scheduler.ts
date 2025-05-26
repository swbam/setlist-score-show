
import { supabase } from "@/integrations/supabase/client";

/**
 * Background update scheduler for artist data, shows, and trends
 * 
 * This service coordinates background updates using the data consistency layer
 */

// Cache to prevent duplicate update operations
const updateCache = {
  artists: new Map<string, number>(), // artistId -> timestamp
  shows: new Map<string, number>(),   // showId -> timestamp
  trends: 0,                         // timestamp of last trend calculation
};

// Update interval constants (in milliseconds)
const UPDATE_INTERVALS = {
  ARTIST: 24 * 60 * 60 * 1000,      // 24 hours for artist data
  SHOWS: 6 * 60 * 60 * 1000,        // 6 hours for show status
  TRENDS: 60 * 60 * 1000,           // 1 hour for trends
  USER_DATA: 30 * 60 * 1000,        // 30 minutes for user data
};

// Flags to prevent multiple concurrent updates of the same type
const isUpdating = {
  artists: false,
  shows: false,
  trends: false,
};

/**
 * Check if data needs an update based on last update time
 */
function needsUpdate(lastUpdated: number | null, interval: number): boolean {
  if (!lastUpdated) return true;
  
  const now = Date.now();
  return now - lastUpdated > interval;
}

/**
 * Import modules only when needed to avoid circular dependencies
 */
async function getServices() {
  const catalogService = await import("@/services/catalog");
  const ticketmasterService = await import("@/services/ticketmaster");
  const dataConsistency = await import("@/services/dataConsistency");
  return { catalogService, ticketmasterService, dataConsistency };
}

/**
 * Update artist data using the data consistency layer
 */
export async function updateArtist(artistId: string, force = false): Promise<boolean> {
  // Check cache to avoid unnecessary updates
  const lastUpdated = updateCache.artists.get(artistId);
  
  if (!force && !needsUpdate(lastUpdated, UPDATE_INTERVALS.ARTIST)) {
    console.log(`✅ Artist ${artistId} was updated recently, skipping`);
    return false;
  }
  
  try {
    console.log(`🔄 Background update: Refreshing artist data for ${artistId}`);
    const { catalogService, dataConsistency } = await getServices();
    
    // Get artist name first
    const { data: artist } = await supabase
      .from('artists')
      .select('name')
      .eq('id', artistId)
      .maybeSingle();
    
    if (!artist) {
      console.error(`❌ Artist ${artistId} not found in database`);
      return false;
    }
    
    // Use data consistency layer to re-ensure the artist with fresh data
    const updatedArtist = await dataConsistency.ensureArtistExists({
      id: artistId,
      name: artist.name
    });
    
    if (updatedArtist) {
      // Also sync their catalog
      await catalogService.syncArtistCatalog(artistId, force);
      updateCache.artists.set(artistId, Date.now());
      console.log(`✅ Successfully updated artist: ${artistId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating artist ${artistId}:`, error);
    return false;
  }
}

/**
 * Update show status using data consistency layer
 */
export async function updateShow(showId: string, artistName: string): Promise<boolean> {
  // Check cache to avoid unnecessary updates
  const lastUpdated = updateCache.shows.get(showId);
  
  if (!needsUpdate(lastUpdated, UPDATE_INTERVALS.SHOWS)) {
    console.log(`✅ Show ${showId} was updated recently, skipping`);
    return false;
  }
  
  try {
    console.log(`🔄 Background update: Refreshing show data for ${showId}`);
    const { ticketmasterService, dataConsistency } = await getServices();
    
    // Get events for the artist from Ticketmaster
    const events = await ticketmasterService.getArtistEvents(artistName);
    
    // Find matching event
    const event = events.find(e => e.id === showId);
    
    if (event) {
      // Use data consistency layer to process the complete event
      const processed = await dataConsistency.processTicketmasterEvent(event);
      
      if (processed.show) {
        updateCache.shows.set(showId, Date.now());
        console.log(`✅ Successfully updated show: ${showId}`);
        return true;
      }
    }
    
    console.warn(`⚠️ Show ${showId} not found in Ticketmaster results`);
    return false;
  } catch (error) {
    console.error(`❌ Error updating show ${showId}:`, error);
    return false;
  }
}

/**
 * Update trending artists and shows using data consistency layer
 */
export async function updateTrends(): Promise<boolean> {
  // Check if trends were updated recently
  if (isUpdating.trends || !needsUpdate(updateCache.trends, UPDATE_INTERVALS.TRENDS)) {
    console.log('✅ Trends were updated recently, skipping');
    return false;
  }
  
  isUpdating.trends = true;
  
  try {
    console.log('🔄 Background update: Updating trending data');
    
    // Get popular events from Ticketmaster
    const { ticketmasterService, dataConsistency } = await getServices();
    const events = await ticketmasterService.getPopularEvents(20);
    
    // Process each event using data consistency layer
    let processedCount = 0;
    
    for (const event of events) {
      if (!event._embedded?.attractions?.[0] || !event._embedded?.venues?.[0]) continue;
      
      try {
        // Use the main data consistency function
        const processed = await dataConsistency.processTicketmasterEvent(event);
        
        if (processed.artist && processed.venue && processed.show) {
          processedCount++;
          console.log(`✅ Processed trending event: ${event.name}`);
        }
      } catch (eventError) {
        console.error(`❌ Error processing trending event ${event.id}:`, eventError);
        continue;
      }
    }
    
    console.log(`✅ Updated ${processedCount} trending events`);
    
    updateCache.trends = Date.now();
    return true;
  } catch (error) {
    console.error('❌ Error updating trends:', error);
    return false;
  } finally {
    isUpdating.trends = false;
  }
}

/**
 * Initialize periodic background updates
 * This will be called from main App component
 */
export function initBackgroundUpdates(): void {
  console.log('🚀 Initializing background update scheduler...');
  
  // Initial trends update after 5 seconds
  setTimeout(() => {
    updateTrends().catch(error => {
      console.error('❌ Initial trend update failed:', error);
    });
  }, 5000);
  
  // Periodic trend updates every hour
  setInterval(() => {
    updateTrends().catch(error => {
      console.error('❌ Periodic trend update failed:', error);
    });
  }, UPDATE_INTERVALS.TRENDS);
  
  console.log('✅ Background update scheduler initialized');
}

/**
 * Manual trigger for updating a specific artist
 */
export async function triggerArtistUpdate(artistId: string): Promise<boolean> {
  return await updateArtist(artistId, true);
}

/**
 * Manual trigger for updating trending data
 */
export async function triggerTrendingUpdate(): Promise<boolean> {
  return await updateTrends();
}
