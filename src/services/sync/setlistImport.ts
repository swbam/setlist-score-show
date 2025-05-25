
import { supabase } from "@/integrations/supabase/client";
import * as setlistfmService from "@/services/setlistfm";
import { SyncResult, SetlistSyncData } from "./types";

/**
 * Import actual setlists for shows that occurred in the last 24 hours
 */
export const importRecentSetlists = async (): Promise<SyncResult> => {
  try {
    console.log('Starting recent setlists import...');
    
    // Get shows from the last 24 hours that don't have played setlists yet
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: recentShows } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artist:artists(name),
        venue:venues(name, city)
      `)
      .gte('date', yesterday.toISOString())
      .lt('date', new Date().toISOString())
      .not('id', 'in', 
        supabase.from('played_setlists').select('show_id')
      )
      .limit(10);

    if (!recentShows?.length) {
      return { success: true, message: 'No recent shows to process' };
    }

    let processed = 0;
    for (const show of recentShows) {
      try {
        // Search for setlist on setlist.fm
        const setlistData = await setlistfmService.searchSetlists(
          show.artist.name,
          show.date.split('T')[0].replace(/-/g, '-')
        );

        if (setlistData && setlistData.length > 0) {
          // Import the first matching setlist
          const setlist = setlistData[0];
          await setlistfmService.storePlayedSetlist(show.id, setlist.id, setlist.eventDate);
          processed++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error importing setlist for show ${show.id}:`, error);
      }
    }

    return { 
      success: true, 
      message: `Imported setlists for ${processed} shows`,
      data: { processed } as SetlistSyncData
    };
  } catch (error) {
    console.error('Error importing recent setlists:', error);
    return { success: false, message: 'Failed to import recent setlists' };
  }
};
