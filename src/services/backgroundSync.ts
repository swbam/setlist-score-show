
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import * as setlistfmService from "@/services/setlistfm";

/**
 * Background synchronization service for TheSet
 * Handles automated data imports and updates
 */

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

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
        
        // Find or create artist
        const spotifyId = await spotifyService.findOrCreateArtist(attraction.name);
        if (!spotifyId) continue;

        // Extract venue info
        const venues = event._embedded?.venues || [];
        if (venues.length === 0) continue;

        const venue = venues[0];
        
        // Store venue if not exists
        await supabase.from('venues').upsert({
          id: venue.id,
          name: venue.name,
          city: venue.city.name,
          state: venue.state?.stateCode,
          country: venue.country.countryCode,
          address: venue.address?.line1,
          latitude: parseFloat(venue.location?.latitude) || null,
          longitude: parseFloat(venue.location?.longitude) || null
        });

        // Store show
        const showDate = event.dates?.start?.localDate;
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
      data: { processed }
    };
  } catch (error) {
    console.error('Error syncing trending shows:', error);
    return { success: false, message: 'Failed to sync trending shows' };
  }
};

/**
 * Sync artist catalogs - updates song catalogs for active artists
 */
export const syncArtistCatalogs = async (): Promise<SyncResult> => {
  try {
    console.log('Starting artist catalog sync...');
    
    // Get artists with upcoming shows that need catalog updates
    const { data: artists } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        last_synced_at,
        shows!inner(id, date)
      `)
      .gte('shows.date', new Date().toISOString())
      .lt('last_synced_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Not synced in 7 days
      .limit(20); // Process 20 artists at a time

    if (!artists?.length) {
      return { success: true, message: 'No artists need catalog sync' };
    }

    let processed = 0;
    for (const artist of artists) {
      try {
        // Import artist's catalog
        await spotifyService.importArtistCatalog(artist.id);
        
        // Update last_synced_at
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);
        
        processed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error syncing catalog for artist ${artist.name}:`, error);
      }
    }

    return { 
      success: true, 
      message: `Synced catalogs for ${processed} artists`,
      data: { processed }
    };
  } catch (error) {
    console.error('Error syncing artist catalogs:', error);
    return { success: false, message: 'Failed to sync artist catalogs' };
  }
};

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
        const setlistData = await setlistfmService.searchSetlist(
          show.artist.name,
          show.date,
          show.venue.name
        );

        if (setlistData) {
          // Import the setlist
          await setlistfmService.importPlayedSetlist(show.id, setlistData);
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
      data: { processed }
    };
  } catch (error) {
    console.error('Error importing recent setlists:', error);
    return { success: false, message: 'Failed to import recent setlists' };
  }
};

/**
 * Calculate and update trending statistics
 */
export const updateTrendingStats = async (): Promise<SyncResult> => {
  try {
    console.log('Starting trending stats update...');
    
    // Calculate trending based on recent votes and views
    const { data: trendingShows } = await supabase
      .from('shows')
      .select(`
        id,
        view_count,
        setlists(
          setlist_songs(votes)
        )
      `)
      .gte('date', new Date().toISOString()) // Only future shows
      .order('view_count', { ascending: false })
      .limit(100);

    if (!trendingShows?.length) {
      return { success: true, message: 'No shows to analyze for trending' };
    }

    // Calculate trending scores based on votes and views
    const showScores = trendingShows.map(show => {
      const totalVotes = show.setlists?.[0]?.setlist_songs?.reduce(
        (sum, song) => sum + song.votes, 0
      ) || 0;
      
      // Simple trending algorithm: combines views and votes with recency
      const score = (show.view_count * 0.3) + (totalVotes * 0.7);
      
      return { showId: show.id, score };
    });

    // Sort by score and update view counts for top shows
    showScores.sort((a, b) => b.score - a.score);
    
    return { 
      success: true, 
      message: `Updated trending stats for ${showScores.length} shows`,
      data: { analyzed: showScores.length }
    };
  } catch (error) {
    console.error('Error updating trending stats:', error);
    return { success: false, message: 'Failed to update trending stats' };
  }
};

/**
 * Run all background sync operations
 */
export const runFullSync = async (): Promise<SyncResult[]> => {
  console.log('Starting full background sync...');
  
  const results = await Promise.allSettled([
    syncTrendingShows(),
    syncArtistCatalogs(),
    importRecentSetlists(),
    updateTrendingStats()
  ]);

  return results.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : { success: false, message: 'Sync operation failed' }
  );
};

/**
 * Manual sync trigger for development/testing
 */
export const triggerManualSync = async (syncType: 'trending' | 'catalogs' | 'setlists' | 'stats' | 'full') => {
  switch (syncType) {
    case 'trending':
      return await syncTrendingShows();
    case 'catalogs':
      return await syncArtistCatalogs();
    case 'setlists':
      return await importRecentSetlists();
    case 'stats':
      return await updateTrendingStats();
    case 'full':
      return await runFullSync();
    default:
      return { success: false, message: 'Invalid sync type' };
  }
};
