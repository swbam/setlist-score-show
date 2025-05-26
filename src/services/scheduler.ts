
import { supabase } from "@/integrations/supabase/client";

/**
 * Background update scheduler for artist data, shows, and trends
 * 
 * This service coordinates background updates at appropriate intervals
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
  const artistUtils = await import("@/utils/artistUtils");
  const catalogService = await import("@/services/catalog");
  const ticketmasterService = await import("@/services/ticketmaster");
  const dataConsistency = await import("@/services/dataConsistency");
  return { artistUtils, catalogService, ticketmasterService, dataConsistency };
}

/**
 * Update artist data (metadata and catalog)
 */
export async function updateArtist(artistId: string, force = false): Promise<boolean> {
  // Check cache to avoid unnecessary updates
  const lastUpdated = updateCache.artists.get(artistId);
  
  if (!force && !needsUpdate(lastUpdated, UPDATE_INTERVALS.ARTIST)) {
    console.log(`Artist ${artistId} was updated recently, skipping`);
    return false;
  }
  
  try {
    console.log(`Background update: Refreshing artist data for ${artistId}`);
    const { catalogService } = await getServices();
    
    // Update artist catalog
    const success = await catalogService.syncArtistCatalog(artistId, force);
    
    if (success) {
      updateCache.artists.set(artistId, Date.now());
    }
    
    return success;
  } catch (error) {
    console.error(`Error updating artist ${artistId}:`, error);
    return false;
  }
}

/**
 * Update show status from Ticketmaster
 */
export async function updateShow(showId: string, artistName: string): Promise<boolean> {
  // Check cache to avoid unnecessary updates
  const lastUpdated = updateCache.shows.get(showId);
  
  if (!needsUpdate(lastUpdated, UPDATE_INTERVALS.SHOWS)) {
    console.log(`Show ${showId} was updated recently, skipping`);
    return false;
  }
  
  try {
    console.log(`Background update: Refreshing show data for ${showId}`);
    const { ticketmasterService } = await getServices();
    
    // Get events for the artist from Ticketmaster
    const events = await ticketmasterService.getArtistEvents(artistName);
    
    // Find matching event
    const event = events.find(e => e.id === showId);
    
    if (event) {
      // Get venue and artist details
      const venue = event._embedded?.venues?.[0];
      const artist = event._embedded?.attractions?.[0];
      
      if (venue && artist) {
        // Store venue in database
        await ticketmasterService.storeVenueInDatabase(venue);
        
        // Store show in database (will update if exists)
        await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
        
        updateCache.shows.set(showId, Date.now());
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating show ${showId}:`, error);
    return false;
  }
}

/**
 * Update trending artists and shows
 */
export async function updateTrends(): Promise<boolean> {
  // Check if trends were updated recently
  if (isUpdating.trends || !needsUpdate(updateCache.trends, UPDATE_INTERVALS.TRENDS)) {
    console.log('Trends were updated recently, skipping');
    return false;
  }
  
  isUpdating.trends = true;
  
  try {
    console.log('Background update: Recalculating trends');
    
    // Get popular events from Ticketmaster
    const { ticketmasterService, dataConsistency } = await getServices();
    const events = await ticketmasterService.getPopularEvents(20);
    
    // Process each event to ensure artist and show data is up to date
    let processedCount = 0;
    
    for (const event of events) {
      if (!event._embedded?.attractions?.[0] || !event._embedded?.venues?.[0]) continue;
      
      const artist = event._embedded.attractions[0];
      const venue = event._embedded.venues[0];
      
      // Store venue in database
      await ticketmasterService.storeVenueInDatabase(venue);
      
      // Create artist object using data consistency layer
      const artistData = await dataConsistency.ensureArtistExists({
        id: artist.id,
        name: artist.name,
        ticketmaster_id: artist.id
      });
      
      if (artistData) {
        // Store show
        await ticketmasterService.storeShowInDatabase(event, artistData.id, venue.id);
        processedCount++;
      }
    }
    
    console.log(`Updated ${processedCount} trending events`);
    
    updateCache.trends = Date.now();
    return true;
  } catch (error) {
    console.error('Error updating trends:', error);
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
  // Initial trends update
  setTimeout(() => {
    updateTrends().catch(console.error);
  }, 5000); // Wait 5 seconds after app load
  
  // Periodic trend updates
  setInterval(() => {
    updateTrends().catch(console.error);
  }, UPDATE_INTERVALS.TRENDS);
  
  console.log('Background update scheduler initialized');
}
