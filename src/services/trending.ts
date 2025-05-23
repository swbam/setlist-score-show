
import { supabase } from "@/integrations/supabase/client";

export interface TrendingShow {
  id: string;
  name: string;
  date: string;
  votes: number;
  artist_name: string;
  venue_name: string;
  venue_city: string;
  image_url?: string;
}

/**
 * Fetch trending shows based on voting activity
 */
export async function getTrendingShows(limit: number = 4): Promise<TrendingShow[]> {
  try {
    console.log("Fetching trending shows with limit:", limit);
    
    // Query shows with setlists and their votes
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist_id,
        venue_id,
        artists (
          name,
          image_url
        ),
        venues (
          name, 
          city
        ),
        setlists (
          id,
          setlist_songs (
            id,
            votes
          )
        )
      `)
      .order('date', { ascending: true })
      .limit(50); // Get more than needed so we can sort by votes
    
    if (error) {
      console.error("Database error fetching trending shows:", error);
      return [];
    }

    console.log("Raw shows data from database:", data);
    
    if (!data || data.length === 0) {
      console.log("No shows found in database");
      return [];
    }
    
    // Process the data to calculate total votes per show and format for display
    const processedData = data
      .filter(show => show.artists && show.venues) // Ensure we have related data
      .map(show => {
        // Calculate total votes across all setlist songs
        const totalVotes = show.setlists && show.setlists.length > 0
          ? show.setlists.reduce((sum, setlist) => {
              if (setlist && setlist.setlist_songs) {
                return sum + setlist.setlist_songs.reduce((songSum, song) => songSum + (song.votes || 0), 0);
              }
              return sum;
            }, 0)
          : 0;
          
        return {
          id: show.id,
          name: show.name || `${show.artists.name} Concert`,
          date: show.date,
          votes: totalVotes,
          artist_name: show.artists.name,
          venue_name: show.venues.name,
          venue_city: show.venues.city,
          image_url: show.artists.image_url
        };
      })
      // Sort by votes in descending order
      .sort((a, b) => b.votes - a.votes)
      // Take only the requested limit
      .slice(0, limit);
    
    console.log("Processed trending shows:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error getting trending shows:", error);
    return [];
  }
}
