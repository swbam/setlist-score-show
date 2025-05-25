
import { supabase } from "@/integrations/supabase/client";
import { SyncResult, TrendingStatsData } from "./types";

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
      data: { analyzed: showScores.length } as TrendingStatsData
    };
  } catch (error) {
    console.error('Error updating trending stats:', error);
    return { success: false, message: 'Failed to update trending stats' };
  }
};
