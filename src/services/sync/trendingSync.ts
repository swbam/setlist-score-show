
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";
import * as dataConsistency from "@/services/dataConsistency";
import { SyncResult, TrendingSyncData } from "./types";

/**
 * Sync trending shows - updates popular shows every 6 hours
 * Uses the data consistency layer to ensure all data is properly stored
 */
export const syncTrendingShows = async (): Promise<SyncResult> => {
  try {
    console.log('Starting trending shows sync...');
    
    // Get popular events from Ticketmaster
    const popularEvents = await ticketmasterService.getPopularEvents(20);
    
    if (!popularEvents.length) {
      return { success: false, message: 'No popular events found' };
    }

    // Process and store shows using the data consistency layer
    let processed = 0;
    let errors = 0;
    
    for (const event of popularEvents) {
      try {
        console.log(`Processing event: ${event.name} (${event.id})`);
        
        // Use the data consistency layer to process the entire event
        const result = await dataConsistency.processTicketmasterEvent(event);
        
        if (result.artist && result.venue && result.show) {
          processed++;
          console.log(`Successfully processed event ${event.name} (${processed}/${popularEvents.length})`);
        } else {
          console.error(`Failed to process event ${event.name}`);
          errors++;
        }
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
