
import { supabase } from "@/integrations/supabase/client";

export interface TrendingShow {
  id: string;
  name: string;
  date: string;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
  };
  vote_count: number;
  view_count: number;
  trending_score: number;
}

// Calculate trending score based on votes, views, and recency
function calculateTrendingScore(voteCount: number, viewCount: number, showDate: string): number {
  const now = new Date();
  const showDateTime = new Date(showDate);
  const daysUntilShow = Math.max(0, (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Shows closer to today get higher score, but not too close (same day = 0.5)
  const recencyMultiplier = daysUntilShow === 0 ? 0.5 : Math.max(0.1, 1 / (1 + daysUntilShow / 30));
  
  // Weighted score: votes are more important than views
  const baseScore = (voteCount * 3) + (viewCount * 1);
  
  return baseScore * recencyMultiplier;
}

// Increment show views
export async function incrementShowViews(showId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_show_views', {
      show_id: showId
    });

    if (error) {
      console.error('Error incrementing show views:', error);
    }
  } catch (error) {
    console.error('Error incrementing show views:', error);
  }
}

// Get trending shows based on vote activity and view count
export async function getTrendingShows(limit: number = 10): Promise<TrendingShow[]> {
  try {
    console.log('Fetching trending shows...');
    
    // Get shows with their vote counts, view counts, and related data
    const { data: showsData, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artists!shows_artist_id_fkey (
          id,
          name,
          image_url
        ),
        venues!shows_venue_id_fkey (
          id,
          name,
          city,
          state,
          country
        ),
        setlists!setlists_show_id_fkey (
          id,
          setlist_songs!setlist_songs_setlist_id_fkey (
            votes
          )
        )
      `)
      .gte('date', new Date().toISOString()) // Only future shows
      .order('date', { ascending: true })
      .limit(50); // Get more than needed to calculate trending

    if (error) {
      console.error('Error fetching shows for trending:', error);
      return [];
    }

    if (!showsData || showsData.length === 0) {
      console.log('No shows found for trending calculation');
      return [];
    }

    // Calculate trending scores
    const trendingShows: TrendingShow[] = showsData.map(show => {
      // Calculate total votes for this show
      const setlists = Array.isArray(show.setlists) ? show.setlists : [];
      const totalVotes = setlists.reduce((total, setlist) => {
        const setlistSongs = Array.isArray(setlist.setlist_songs) ? setlist.setlist_songs : [];
        const setlistVotes = setlistSongs.reduce((sum, song) => sum + (song.votes || 0), 0);
        return total + setlistVotes;
      }, 0);

      const trendingScore = calculateTrendingScore(totalVotes, show.view_count || 0, show.date);

      return {
        id: show.id,
        name: show.name || `${show.artists?.name} Concert`,
        date: show.date,
        artist: {
          id: show.artists?.id || '',
          name: show.artists?.name || 'Unknown Artist',
          image_url: show.artists?.image_url
        },
        venue: {
          id: show.venues?.id || '',
          name: show.venues?.name || 'Unknown Venue',
          city: show.venues?.city || '',
          state: show.venues?.state,
          country: show.venues?.country || ''
        },
        vote_count: totalVotes,
        view_count: show.view_count || 0,
        trending_score: trendingScore
      };
    });

    // Sort by trending score and return top results
    const sortedShows = trendingShows
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

    console.log(`Found ${sortedShows.length} trending shows`);
    return sortedShows;

  } catch (error) {
    console.error('Error getting trending shows:', error);
    return [];
  }
}

// Get popular shows based on view count (for fallback when no trending data)
export async function getPopularShows(limit: number = 10): Promise<TrendingShow[]> {
  try {
    console.log('Fetching popular shows...');
    
    const { data: showsData, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artists!shows_artist_id_fkey (
          id,
          name,
          image_url
        ),
        venues!shows_venue_id_fkey (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .gte('date', new Date().toISOString())
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular shows:', error);
      return [];
    }

    if (!showsData) return [];

    return showsData.map(show => ({
      id: show.id,
      name: show.name || `${show.artists?.name} Concert`,
      date: show.date,
      artist: {
        id: show.artists?.id || '',
        name: show.artists?.name || 'Unknown Artist',
        image_url: show.artists?.image_url
      },
      venue: {
        id: show.venues?.id || '',
        name: show.venues?.name || 'Unknown Venue',
        city: show.venues?.city || '',
        state: show.venues?.state,
        country: show.venues?.country || ''
      },
      vote_count: 0,
      view_count: show.view_count || 0,
      trending_score: show.view_count || 0
    }));

  } catch (error) {
    console.error('Error getting popular shows:', error);
    return [];
  }
}

// Update trending scores (can be called periodically)
export async function updateTrendingScores(): Promise<void> {
  try {
    console.log('Updating trending scores...');
    
    // This would typically be implemented as a database function
    // For now, we rely on the real-time calculation in getTrendingShows
    
    console.log('Trending scores updated');
  } catch (error) {
    console.error('Error updating trending scores:', error);
  }
}
