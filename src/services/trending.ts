
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";
import { isValid } from "date-fns";

export interface TrendingShow {
  id: string;
  name: string;
  date: string;
  votes: number;
  artist_name: string;
  venue_name: string;
  venue_city: string;
  image_url?: string;
  artist_id?: string; // Added to track unique artists
}

/**
 * Validate date string to ensure it's parseable
 */
const isValidDateString = (dateStr: any): boolean => {
  if (!dateStr) return false;
  if (typeof dateStr !== 'string') return false;
  
  try {
    const date = new Date(dateStr);
    return isValid(date);
  } catch (e) {
    return false;
  }
};

/**
 * Safely parse a date string and return null if invalid
 */
const safeParseDateString = (dateStr: any): string | null => {
  if (!dateStr) return null;
  if (typeof dateStr !== 'string') return null;
  
  try {
    const date = new Date(dateStr);
    if (isValid(date)) {
      return date.toISOString();
    }
  } catch (e) {
    console.error("Error parsing date:", e, dateStr);
  }
  
  return null;
};

/**
 * Fetch trending shows based on both Ticketmaster API and voting activity
 * Ensures no duplicate artists are returned
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
      
      // Ensure we have a valid date string using our helper
      const dateString = safeParseDateString(event.dates?.start?.dateTime);
      
      return {
        id: event.id,
        name: event.name,
        date: dateString,
        votes: 0, // New events from API start with 0 votes
        artist_name: artist?.name || 'Various Artists',
        artist_id: artist?.id, // Store artist ID to check for duplicates
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
          id,
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
      .limit(limit * 2); // Get more than we need to account for filtering
    
    if (error) {
      console.error("Database error fetching trending shows:", error);
      // Return just Ticketmaster shows if DB call fails
      return removeDuplicateArtists(ticketmasterShows, limit);
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
          
          // Ensure date is valid using our helper function
          const dateString = safeParseDateString(show.date);
              
          return {
            id: show.id,
            name: show.name || `${show.artists.name} Concert`,
            date: dateString,
            votes: totalVotes,
            artist_name: show.artists.name,
            artist_id: show.artist_id, // Store artist ID to check for duplicates
            venue_name: show.venues.name,
            venue_city: show.venues.city,
            image_url: show.artists.image_url
          };
        })
        .filter(show => show.votes > 0 || show.date !== null); // Only include shows with votes or valid dates
      
      // Combine API and DB shows
      const combinedShows = [...processedDbShows, ...ticketmasterShows];
      
      // Filter out duplicate shows by ID first
      const uniqueShowsById = Array.from(
        combinedShows.reduce((map, show) => map.set(show.id, show), new Map()).values()
      );
      
      // Now remove duplicate artists and limit to requested number
      return removeDuplicateArtists(uniqueShowsById, limit);
    }
    
    console.log("Using only Ticketmaster shows");
    return removeDuplicateArtists(ticketmasterShows, limit);
  } catch (error) {
    console.error("Error getting trending shows:", error);
    return [];
  }
}

/**
 * Removes duplicate artists from the list of shows and limits to the specified count
 */
function removeDuplicateArtists(shows: TrendingShow[], limit: number): TrendingShow[] {
  // First, sort by votes (for shows with votes) and then by date
  shows.sort((a, b) => {
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

  // Set to track artist IDs we've already added
  const seenArtistIds = new Set<string>();
  const seenArtistNames = new Set<string>();
  const result: TrendingShow[] = [];
  
  // Add shows with unique artists until we reach the limit
  for (const show of shows) {
    // Skip if we've hit the limit
    if (result.length >= limit) break;
    
    // Skip shows with no artist information
    if (!show.artist_id && !show.artist_name) continue;
    
    // Check if we've seen this artist before (by ID or name)
    const artistId = show.artist_id || '';
    const artistName = show.artist_name.toLowerCase();
    
    if ((artistId && seenArtistIds.has(artistId)) || seenArtistNames.has(artistName)) {
      // Skip this show, we already have this artist
      continue;
    }
    
    // Add this show and mark the artist as seen
    result.push(show);
    if (artistId) seenArtistIds.add(artistId);
    seenArtistNames.add(artistName);
  }
  
  console.log(`Filtered to ${result.length} unique artists`);
  return result;
}
