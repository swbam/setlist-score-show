
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
    const popularEvents = await ticketmasterService.getPopularEvents();
    
    if (!popularEvents.length) {
      return { success: false, message: 'No popular events found' };
    }

    // Process and store shows
    let processed = 0;
    for (const event of popularEvents.slice(0, 50)) { // Limit to 50 shows
      try {
        // Extract artist info
        const attractions = event._embedded?.attractions || [];
        if (attractions.length === 0) continue;

        const attraction = attractions[0];
        
        // Find or create artist using the mapping service
        const spotifyId = await findSpotifyArtistForTicketmaster(attraction.id, attraction.name);
        if (!spotifyId) continue;

        // Extract venue info
        const venues = event._embedded?.venues || [];
        if (venues.length === 0) continue;

        const venue = venues[0];
        
        // Store venue if not exists
        await supabase.from('venues').upsert({
          id: venue.id,
          name: venue.name,
          city: venue.city?.name || '',
          state: venue.state?.name || null,
          country: venue.country?.name || '',
          address: venue.address?.line1 || null,
          latitude: venue.location?.latitude ? parseFloat(venue.location.latitude.toString()) : null,
          longitude: venue.location?.longitude ? parseFloat(venue.location.longitude.toString()) : null
        });

        // Store show
        const showDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
        if (!showDate) continue;

        await supabase.from('shows').upsert({
          id: event.id,
          artist_id: spotifyId,
          venue_id: venue.id,
          name: event.name,
          date: new Date(showDate).toISOString(),
          start_time: event.dates?.start?.localTime || null,
          status: event.dates?.status?.code === 'onsale' ? 'scheduled' : 'canceled',
          ticketmaster_url: event.url,
          view_count: 0
        });

        processed++;
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
      }
    }

    return { 
      success: true, 
      message: `Synced ${processed} trending shows`,
      data: { processed } as TrendingSyncData
    };
  } catch (error) {
    console.error('Error syncing trending shows:', error);
    return { success: false, message: 'Failed to sync trending shows' };
  }
};
