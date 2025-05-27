import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "./ticketmaster";
import * as dataConsistency from "./dataConsistency";

/**
 * Background sync functions to keep data fresh
 */

export async function syncTrendingShows(): Promise<boolean> {
  try {
    console.log('🔥 Starting trending shows sync...');
    
    // Fetch trending events from Ticketmaster API
    const events = await ticketmasterService.getPopularEvents(50);
    
    let synced = 0;
    for (const event of events) {
      try {
        const processed = await dataConsistency.processTicketmasterEvent(event);
        if (processed.show) {
          synced++;
        }
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
      }
    }
    
    console.log(`✅ Synced ${synced} trending shows`);
    return true;
  } catch (error) {
    console.error('❌ Error syncing trending shows:', error);
    return false;
  }
}
export async function updateShowViewCounts(): Promise<boolean> {
  try {
    console.log('📊 Updating show view counts...');
    
    // Update trending scores based on votes and views
    const { data: shows, error } = await supabase
      .from('shows')
      .select(`
        id,
        view_count,
        setlists(
          setlist_songs(votes)
        )
      `)
      .gte('date', new Date().toISOString());
    
    if (error) {
      console.error('Error fetching shows for trending update:', error);
      return false;
    }
    
    // Update view counts based on voting activity
    for (const show of shows || []) {
      let totalVotes = 0;
      
      if (show.setlists) {
        const setlists = Array.isArray(show.setlists) ? show.setlists : [show.setlists];
        for (const setlist of setlists) {
          if (setlist && setlist.setlist_songs) {
            const setlistVotes = setlist.setlist_songs.reduce((sum: number, song: any) => {
              return sum + (song.votes || 0);
            }, 0);
            totalVotes += setlistVotes;
          }
        }
      }
      
      // Increment view count based on vote activity
      if (totalVotes > 0) {
        await supabase.rpc('increment_show_views', { show_id: show.id });
      }
    }
    
    console.log('✅ Updated show view counts');
    return true;
  } catch (error) {
    console.error('❌ Error updating view counts:', error);
    return false;
  }
}

export async function cleanupExpiredVoteLimits(): Promise<boolean> {
  try {
    console.log('🧹 Cleaning up expired vote limits...');
    
    // Reset daily votes for expired periods
    const { error } = await supabase
      .from('vote_limits')
      .update({ 
        daily_votes: 0,
        last_daily_reset: new Date().toISOString().split('T')[0] 
      })
      .lt('last_daily_reset', new Date().toISOString().split('T')[0]);
    
    if (error) {
      console.error('Error cleaning vote limits:', error);
      return false;
    }
    
    console.log('✅ Cleaned up expired vote limits');
    return true;
  } catch (error) {
    console.error('❌ Error cleaning vote limits:', error);
    return false;
  }
}

// Main sync function to run all background tasks
export async function runFullSync(): Promise<void> {
  console.log('🚀 Starting full background sync...');
  
  const tasks = [
    syncTrendingShows(),
    updateShowViewCounts(),
    cleanupExpiredVoteLimits()
  ];
  
  const results = await Promise.allSettled(tasks);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  console.log(`✅ Background sync completed: ${successful}/${tasks.length} tasks successful`);
}
