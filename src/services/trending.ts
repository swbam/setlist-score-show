
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
    
    // Get shows with vote activity in the last 7 days
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        ticketmaster_url,
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

    if (showsError) {
      console.error("Error fetching trending shows:", showsError);
      return [];
    }

    // Transform the data to ensure type safety
    const trendingShows: TrendingShow[] = (showsData || []).map(show => ({
      id: show.id,
      name: show.name,
      date: show.date,
      start_time: show.start_time,
      ticketmaster_url: show.ticketmaster_url,
      view_count: show.view_count,
      votes: 0, // Will be calculated separately
      artist_name: (show.artists as any)?.name || 'Unknown Artist',
      venue_name: (show.venues as any)?.name || 'Unknown Venue',
      venue_city: (show.venues as any)?.city || '',
      artist: {
        id: (show.artists as any)?.id || '',
        name: (show.artists as any)?.name || 'Unknown Artist',
        image_url: (show.artists as any)?.image_url
      },
      venue: {
        id: (show.venues as any)?.id || '',
        name: (show.venues as any)?.name || 'Unknown Venue',
        city: (show.venues as any)?.city || '',
        state: (show.venues as any)?.state,
        country: (show.venues as any)?.country || ''
      }
    }));

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
      .gte('date', thirtyDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular shows:", error);
      return [];
    }

    // Transform the data to ensure type safety
    const popularShows: TrendingShow[] = (showsData || []).map(show => ({
      id: show.id,
      name: show.name,
      date: show.date,
      start_time: show.start_time,
      ticketmaster_url: show.ticketmaster_url,
      view_count: show.view_count,
      votes: 0,
      artist_name: (show.artists as any)?.name || 'Unknown Artist',
      venue_name: (show.venues as any)?.name || 'Unknown Venue', 
      venue_city: (show.venues as any)?.city || '',
      artist: {
        id: (show.artists as any)?.id || '',
        name: (show.artists as any)?.name || 'Unknown Artist',
        image_url: (show.artists as any)?.image_url
      },
      venue: {
        id: (show.venues as any)?.id || '',
        name: (show.venues as any)?.name || 'Unknown Venue',
        city: (show.venues as any)?.city || '',
        state: (show.venues as any)?.state,
        country: (show.venues as any)?.country || ''
      }
    }));

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
    const { error } = await supabase
      .from('shows')
      .update({ 
        view_count: (await supabase.from('shows').select('view_count').eq('id', showId).single()).data?.view_count + 1 || 1
      })
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
