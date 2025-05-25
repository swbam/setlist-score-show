import { supabase } from "@/integrations/supabase/client";

export interface TrendingShow {
  id: string;
  name?: string;
  date: string;
  start_time?: string;
  ticketmaster_url?: string;
  view_count: number;
  votes: number;
  artist_name: string;
  venue_name: string;
  venue_city: string;
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
}

// Calculate trending shows based on vote activity and view count
export async function getTrendingShows(limit: number = 10): Promise<TrendingShow[]> {
  try {
    console.log("Fetching trending shows...");
    
    // Get shows with vote activity and high view counts
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        ticketmaster_url,
        view_count,
        artists!fk_shows_artist_id (
          id,
          name,
          image_url
        ),
        venues!fk_shows_venue_id (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .gte('date', new Date().toISOString())
      .order('view_count', { ascending: false })
      .limit(limit * 2); // Get more to filter properly

    if (showsError) {
      console.error("Error fetching trending shows:", showsError);
      return [];
    }

    if (!showsData || showsData.length === 0) {
      console.log("No shows found for trending");
      return [];
    }

    // Calculate vote counts for each show
    const showsWithVotes = await Promise.all(
      showsData.map(async (show) => {
        // Get total votes for this show
        const { data: setlist } = await supabase
          .from('setlists')
          .select('id')
          .eq('show_id', show.id)
          .maybeSingle();

        let totalVotes = 0;
        if (setlist) {
          const { data: votes } = await supabase
            .from('setlist_songs')
            .select('votes')
            .eq('setlist_id', setlist.id);
          
          totalVotes = votes?.reduce((sum, song) => sum + song.votes, 0) || 0;
        }

        const artist = show.artists as any;
        const venue = show.venues as any;

        return {
          id: show.id,
          name: show.name,
          date: show.date,
          start_time: show.start_time,
          ticketmaster_url: show.ticketmaster_url,
          view_count: show.view_count,
          votes: totalVotes,
          artist_name: artist?.name || 'Unknown Artist',
          venue_name: venue?.name || 'Unknown Venue',
          venue_city: venue?.city || '',
          artist: {
            id: artist?.id || '',
            name: artist?.name || 'Unknown Artist',
            image_url: artist?.image_url
          },
          venue: {
            id: venue?.id || '',
            name: venue?.name || 'Unknown Venue',
            city: venue?.city || '',
            state: venue?.state,
            country: venue?.country || ''
          }
        };
      })
    );

    // Sort by a combination of view count and votes (trending score)
    const trendingShows = showsWithVotes
      .map(show => ({
        ...show,
        trendingScore: show.view_count + (show.votes * 5) // Weight votes more heavily
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    console.log(`Found ${trendingShows.length} trending shows`);
    return trendingShows;
  } catch (error) {
    console.error("Error getting trending shows:", error);
    return [];
  }
}

// Get popular shows from the last 30 days
export async function getPopularShows(limit: number = 20): Promise<TrendingShow[]> {
  try {
    console.log("Fetching popular shows...");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: showsData, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        ticketmaster_url,
        view_count,
        artists!fk_shows_artist_id (
          id,
          name,
          image_url
        ),
        venues!fk_shows_venue_id (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .gte('date', thirtyDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular shows:", error);
      return [];
    }

    // Transform the data to ensure type safety
    const popularShows: TrendingShow[] = (showsData || []).map(show => {
      const artist = show.artists as any;
      const venue = show.venues as any;
      
      return {
        id: show.id,
        name: show.name,
        date: show.date,
        start_time: show.start_time,
        ticketmaster_url: show.ticketmaster_url,
        view_count: show.view_count,
        votes: 0, // Will be calculated if needed
        artist_name: artist?.name || 'Unknown Artist',
        venue_name: venue?.name || 'Unknown Venue', 
        venue_city: venue?.city || '',
        artist: {
          id: artist?.id || '',
          name: artist?.name || 'Unknown Artist',
          image_url: artist?.image_url
        },
        venue: {
          id: venue?.id || '',
          name: venue?.name || 'Unknown Venue',
          city: venue?.city || '',
          state: venue?.state,
          country: venue?.country || ''
        }
      };
    });

    console.log(`Found ${popularShows.length} popular shows`);
    return popularShows;
  } catch (error) {
    console.error("Error getting popular shows:", error);
    return [];
  }
}

// Increment view count for a show
export async function incrementShowViews(showId: string): Promise<boolean> {
  try {
    // Use direct SQL update instead of raw
    const { error } = await supabase
      .from('shows')
      .update({ view_count: supabase.sql`view_count + 1` })
      .eq('id', showId);

    if (error) {
      console.error("Error incrementing view count:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return false;
  }
}
