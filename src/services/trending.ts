
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";

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
 * Fetch trending shows based on both Ticketmaster API and voting activity
 */
export async function getTrendingShows(limit: number = 6): Promise<TrendingShow[]> {
  try {
    console.log("Fetching trending shows with limit:", limit);
    
    // Get popular music events from Ticketmaster
    const ticketmasterEvents = await ticketmasterService.getPopularEvents(limit * 2);
    console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
    
    // Process Ticketmaster events into our format
    const ticketmasterShows = ticketmasterEvents.map(event => {
      // Extract venue info
      const venue = event._embedded?.venues?.[0];
      // Extract artist info
      const artist = event._embedded?.attractions?.[0];
      
      // Find a suitable image
      let imageUrl = null;
      if (artist?.images && artist.images.length > 0) {
        // Try to find a 16:9 ratio image first
        const wideImage = artist.images.find(img => img.ratio === '16_9');
        // Otherwise use the first image
        imageUrl = wideImage ? wideImage.url : artist.images[0].url;
      } else if (event.images && event.images.length > 0) {
        // Fall back to event images
        const wideImage = event.images.find(img => img.ratio === '16_9');
        imageUrl = wideImage ? wideImage.url : event.images[0].url;
      }
      
      // Ensure we have a valid date string
      let dateString = null;
      if (event.dates?.start?.dateTime && typeof event.dates.start.dateTime === 'string') {
        dateString = event.dates.start.dateTime;
      }
      
      return {
        id: event.id,
        name: event.name,
        date: dateString,
        votes: 0, // New events from API start with 0 votes
        artist_name: artist?.name || 'Various Artists',
        venue_name: venue?.name || 'TBA',
        venue_city: venue?.city?.name || 'TBA',
        image_url: imageUrl
      };
    })
    // Filter out events with invalid dates
    .filter(show => show.date !== null);
    
    // Also get top voted shows from database as a backup
    const { data: dbShows, error } = await supabase
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
      .limit(limit);
    
    if (error) {
      console.error("Database error fetching trending shows:", error);
      // Return just Ticketmaster shows if DB call fails
      return ticketmasterShows.slice(0, limit);
    }
    
    if (dbShows && dbShows.length > 0) {
      // Process the data to calculate total votes per show and format for display
      const processedDbShows = dbShows
        .filter(show => show.artists && show.venues) // Ensure we have related data
        .map(show => {
          // Calculate total votes across all setlist songs
          let totalVotes = 0;
          
          if (show.setlists && Array.isArray(show.setlists) && show.setlists.length > 0) {
            totalVotes = show.setlists.reduce((sum, setlist) => {
              if (setlist && setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
                return sum + setlist.setlist_songs.reduce((songSum, song) => songSum + (song?.votes || 0), 0);
              }
              return sum;
            }, 0);
          }
          
          // Ensure date is valid
          let dateString = show.date && typeof show.date === 'string' ? show.date : null;
              
          return {
            id: show.id,
            name: show.name || `${show.artists.name} Concert`,
            date: dateString,
            votes: totalVotes,
            artist_name: show.artists.name,
            venue_name: show.venues.name,
            venue_city: show.venues.city,
            image_url: show.artists.image_url
          };
        })
        .filter(show => show.votes > 0 && show.date !== null); // Only include shows with votes and valid dates
      
      // Combine API and DB shows, prioritizing ones with votes
      const combinedShows = [...processedDbShows, ...ticketmasterShows];
      
      // Make sure we have unique shows by ID
      const uniqueShows = Array.from(
        combinedShows.reduce((map, show) => map.set(show.id, show), new Map()).values()
      );
      
      // Sort by votes (for shows with votes) and then by date for the rest
      uniqueShows.sort((a, b) => {
        // First prioritize shows with votes
        if (a.votes && b.votes) {
          return b.votes - a.votes;
        } else if (a.votes) {
          return -1; // a has votes, b doesn't
        } else if (b.votes) {
          return 1; // b has votes, a doesn't
        }
        
        // Then sort by date (if both have valid dates)
        if (a.date && b.date) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (a.date) {
          return -1; // a has date, b doesn't
        } else if (b.date) {
          return 1;  // b has date, a doesn't
        }
        
        return 0;
      });
      
      console.log("Combined trending shows:", uniqueShows.length);
      return uniqueShows.slice(0, limit);
    }
    
    console.log("Using only Ticketmaster shows");
    return ticketmasterShows.slice(0, limit);
  } catch (error) {
    console.error("Error getting trending shows:", error);
    return [];
  }
}
