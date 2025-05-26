
import * as dataConsistency from "@/services/dataConsistency";
import * as search from "@/services/search";
import * as trending from "@/services/trending";
import * as artistUtils from "@/utils/artistUtils";

/**
 * Centralized API service that coordinates all data operations
 * This ensures consistent data handling across the entire app
 */

/**
 * MAIN API FUNCTIONS - USE THESE FOR CONSISTENT DATA HANDLING
 */

/**
 * Process any artist mention in the app
 * This ensures the artist exists with complete data
 */
export async function processArtist(input: {
  id?: string;
  name: string;
  ticketmaster_id?: string;
}) {
  if (input.id) {
    return await dataConsistency.ensureArtistExists({
      id: input.id,
      name: input.name,
      ticketmaster_id: input.ticketmaster_id
    });
  } else {
    return await dataConsistency.findOrCreateArtistByName(input.name);
  }
}

/**
 * Process any show mention in the app
 * This ensures the show, artist, and venue all exist with complete data
 */
export async function processShow(ticketmasterEvent: any) {
  return await dataConsistency.processTicketmasterEvent(ticketmasterEvent);
}

/**
 * Search with automatic data consistency
 * This ensures all search results are properly stored in the database
 */
export async function searchWithConsistency(query: string, options: any = {}) {
  const results = await search.search({ query, ...options });
  await search.storeSearchResults(results);
  return results;
}

/**
 * Get trending data with automatic refresh
 */
export async function getTrendingData(limit: number = 10) {
  const trendingShows = await trending.getTrendingShows(limit);
  
  // If no trending data, fall back to popular
  if (trendingShows.length === 0) {
    return await trending.getPopularShows(limit);
  }
  
  return trendingShows;
}

/**
 * OPERATION GROUPS FOR SPECIFIC USE CASES
 */
export const operations = {
  search: {
    // Main search function
    search: search.search,
    
    // Specific searches
    searchArtists: search.searchArtists,
    searchShows: search.searchShows,
    
    // Cache search results
    storeResults: search.storeSearchResults
  },

  artist: {
    // Get artist (from DB or create)
    getOrCreate: artistUtils.getOrCreateArtist,
    
    // Find by name (search + create)
    findByName: dataConsistency.findOrCreateArtistByName,
    
    // Ensure exists with complete data
    ensure: dataConsistency.ensureArtistExists,
    
    // Get from database only
    getById: artistUtils.getArtistById,
    
    // Sync with external APIs
    sync: artistUtils.syncArtistData,
    
    // Get shows
    getShows: artistUtils.getArtistUpcomingShows
  },

  venue: {
    // Ensure venue exists with complete data
    ensure: dataConsistency.ensureVenueExists
  },

  show: {
    // Ensure show exists with complete data
    ensure: dataConsistency.ensureShowExists,
    
    // Process complete Ticketmaster event
    processEvent: dataConsistency.processTicketmasterEvent
  },

  trending: {
    // Get trending shows
    getTrending: trending.getTrendingShows,
    
    // Get popular shows
    getPopular: trending.getPopularShows,
    
    // Increment views
    incrementViews: trending.incrementShowViews,
    
    // Update trending data
    updateScores: trending.updateTrendingScores
  }
};
