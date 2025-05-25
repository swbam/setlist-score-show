
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";
import { findSpotifyArtistForTicketmaster } from "@/services/artistMapping";
import { SyncResult, TrendingSyncData } from "./types";

/**
 * Sync trending shows - updates popular shows every 6 hours
 */
export const syncTrendingShows = async (): Promise<SyncResult> => {
  try {
    console.log('Starting trending shows sync...');
    
    // Get popular events from Ticketmaster
    const popularEvents = await ticketmasterService.getPopularEvents(20);
    
    if (!popularEvents.length) {
      return { success: false, message: 'No popular events found' };
    }

    // Process and store shows
    let processed = 0;
    let errors = 0;
    
    for (const event of popularEvents) {
      try {
        console.log(`Processing event: ${event.name} (${event.id})`);
        
        // Extract artist info
        const attractions = event._embedded?.attractions || [];
        if (attractions.length === 0) {
          console.log(`Skipping event ${event.name} - no attractions found`);
          continue;
        }

        const attraction = attractions[0];
        
        // Find or create artist using the mapping service
        const spotifyId = await findSpotifyArtistForTicketmaster(attraction.id, attraction.name);
        if (!spotifyId) {
          console.log(`Skipping event ${event.name} - could not find Spotify artist for ${attraction.name}`);
          continue;
        }

        // Extract venue info
        const venues = event._embedded?.venues || [];
        if (venues.length === 0) {
          console.log(`Skipping event ${event.name} - no venues found`);
          continue;
        }

        const venue = venues[0];
        
        // Store venue if not exists - this now handles the improved venue data extraction
        const venueStored = await ticketmasterService.storeVenueInDatabase(venue);
        if (!venueStored) {
          console.error(`Failed to store venue for event ${event.name}`);
          errors++;
          continue;
        }

        // Validate date before storing show
        const showDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
        if (!showDate) {
          console.warn(`Skipping event ${event.name} - no valid date`);
          continue;
        }

        // Store show - this now has improved error handling
        const showStored = await ticketmasterService.storeShowInDatabase(event, spotifyId, venue.id);
        if (!showStored) {
          console.error(`Failed to store show ${event.name}`);
          errors++;
          continue;
        }

        processed++;
        console.log(`Successfully processed event ${event.name} (${processed}/${popularEvents.length})`);
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errors++;
      }
    }

    const message = `Synced ${processed} trending shows with ${errors} errors`;
    console.log(message);

    return { 
      success: processed > 0, 
      message,
      data: { processed, errors } as TrendingSyncData
    };
  } catch (error) {
    console.error('Error syncing trending shows:', error);
    return { success: false, message: 'Failed to sync trending shows' };
  }
};
