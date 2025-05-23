
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
    // Query shows with the most votes on their setlists
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist:artists(id, name, image_url),
        venue:venues(name, city),
        setlist:setlists(
          id,
          setlist_songs:setlist_songs(
            id,
            votes
          )
        )
      `)
      .order('date', { ascending: true })
      .limit(20);
    
    if (error) {
      console.error("Error fetching trending shows:", error);
      return [];
    }
    
    // Process the data to calculate total votes per show
    const processedData: TrendingShow[] = data
      .map(show => {
        // Calculate total votes across all setlist songs
        const totalVotes = show.setlist && show.setlist[0]?.setlist_songs
          ? show.setlist[0].setlist_songs.reduce((sum, song) => sum + (song.votes || 0), 0)
          : 0;
          
        return {
          id: show.id,
          name: show.name || `${show.artist.name} Concert`,
          date: show.date,
          votes: totalVotes,
          artist_name: show.artist.name,
          venue_name: show.venue.name,
          venue_city: show.venue.city,
          image_url: show.artist.image_url
        };
      })
      // Sort by votes in descending order
      .sort((a, b) => b.votes - a.votes)
      // Take only the requested limit
      .slice(0, limit);
      
    return processedData;
  } catch (error) {
    console.error("Error getting trending shows:", error);
    return [];
  }
}
