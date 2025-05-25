import { supabase } from "@/integrations/supabase/client";
import * as artistMapping from "./artistMapping";

// Ticketmaster API key
const TICKETMASTER_API_KEY = "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";

// Types for Ticketmaster API responses
export interface TicketmasterVenue {
  id: string;
  name: string;
  city: {
    name: string;
  };
  state?: {
    name: string;
  };
  country: {
    name: string;
  };
  address?: {
    line1: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime?: string;
      localTime?: string;
    };
    status?: {
      code?: string;
    };
  };
  images?: { url: string; ratio?: string; width?: number; height?: number }[];
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: {
      id: string;
      name: string;
      images?: { url: string; ratio?: string; width?: number; height?: number }[];
    }[];
  };
  url?: string;
}

// Search for events by keyword (artist name)
export async function searchEvents(keyword: string): Promise<TicketmasterEvent[]> {
  try {
    console.log("Searching Ticketmaster events for:", keyword);
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY);
    url.searchParams.append("keyword", keyword);
    url.searchParams.append("size", "20");
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "date,asc");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Ticketmaster API error:", response.status, await response.text());
      throw new Error(`Failed to search events: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    console.log(`Found ${events.length} Ticketmaster events for "${keyword}"`);
    return events;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

// Get events for a specific artist (by name or ID)
export async function getArtistEvents(artistName: string): Promise<TicketmasterEvent[]> {
  try {
    console.log("Getting Ticketmaster events for artist:", artistName);
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY);
    url.searchParams.append("keyword", artistName);
    url.searchParams.append("size", "50");
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "date,asc");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Ticketmaster API error:", response.status, await response.text());
      throw new Error(`Failed to get artist events: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    console.log(`Found ${events.length} Ticketmaster events for "${artistName}"`);
    return events;
  } catch (error) {
    console.error("Error getting artist events:", error);
    return [];
  }
}

// Get popular music events
export async function getPopularEvents(limit: number = 10): Promise<TicketmasterEvent[]> {
  try {
    console.log("Fetching popular music events from Ticketmaster");
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY);
    url.searchParams.append("size", limit.toString());
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "relevance,desc");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Ticketmaster API error:", response.status, await response.text());
      throw new Error(`Failed to fetch popular events: ${response.status}`);
    }
    
    const data = await response.json();
    const events = data._embedded?.events || [];
    console.log(`Found ${events.length} popular Ticketmaster events`);
    return events;
  } catch (error) {
    console.error("Error fetching popular events:", error);
    return [];
  }
}

// Store venue in database
export async function storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
  try {
    console.log("Storing venue in database:", venue.name);
    
    // Ensure required fields are present
    if (!venue || !venue.id || !venue.name || !venue.city || !venue.city.name || !venue.country || !venue.country.name) {
      console.error("Missing required venue data:", venue);
      return false;
    }
    
    const venueData = {
      id: venue.id,
      name: venue.name,
      city: venue.city.name || '',
      state: venue.state?.name || null,
      country: venue.country.name || '',
      address: venue.address?.line1 || null,
      latitude: venue.location?.latitude || null,
      longitude: venue.location?.longitude || null
    };
    
    console.log("Venue data to store:", venueData);
    
    const { error } = await supabase
      .from('venues')
      .upsert(venueData, { onConflict: 'id' });
    
    if (error) {
      console.error("Error storing venue in database:", error);
      return false;
    }
    
    console.log("Successfully stored venue:", venue.name);
    return true;
  } catch (error) {
    console.error("Error storing venue in database:", error);
    return false;
  }
}

// Store show in database
export const storeShowInDatabase = async (
  event: TicketmasterEvent,
  artistId: string,
  venueId: string
): Promise<boolean> => {
  try {
    // First, try to find the correct artist ID (Spotify ID) using our mapping
    let finalArtistId = artistId;
    const artistName = event._embedded?.attractions?.[0]?.name;
    
    if (artistName) {
      // Get or create artist mapping
      const mapping = await artistMapping.getOrCreateArtistMapping(
        artistName,
        undefined, // We don't have Spotify ID yet
        artistId   // This is Ticketmaster ID
      );
      
      if (mapping && mapping.spotify_id) {
        finalArtistId = mapping.spotify_id;
        console.log(`Mapped Ticketmaster artist ${artistId} to Spotify artist ${finalArtistId}`);
      } else {
        console.log(`No Spotify mapping found for Ticketmaster artist ${artistId}, attempting direct lookup`);
        
        // Try to find artist by exact name match in our database
        const { data: artistByName } = await supabase
          .from('artists')
          .select('id')
          .ilike('name', artistName)
          .maybeSingle();
          
        if (artistByName) {
          finalArtistId = artistByName.id;
          console.log(`Found artist by name: ${finalArtistId}`);
        } else {
          console.warn(`Could not find Spotify artist for "${artistName}". Event will not be stored.`);
          return false;
        }
      }
    }
    
    // Check if artist exists in the database
    const { data: artistExists } = await supabase
      .from('artists')
      .select('id')
      .eq('id', finalArtistId)
      .maybeSingle();
    
    if (!artistExists) {
      console.error(`Artist with ID ${finalArtistId} not found in database. Store artist first.`);
      return false;
    }
    
    // Check if venue exists
    const { data: venueExists } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .maybeSingle();
    
    if (!venueExists) {
      console.error(`Venue with ID ${venueId} not found in database. Store venue first.`);
      return false;
    }
    
    // Format the show data
    const showData = {
      id: event.id,
      artist_id: finalArtistId,  // Now using the mapped Spotify ID
      venue_id: venueId,
      name: event.name || null,
      date: event.dates?.start?.dateTime || null,
      start_time: event.dates?.start?.localTime || null,
      status: event.dates?.status?.code === 'cancelled' ? 'canceled' : 
             event.dates?.status?.code === 'postponed' ? 'postponed' : 'scheduled',
      ticketmaster_url: event.url || null
    };
    
    // Check if show already exists
    const { data: existingShow } = await supabase
      .from('shows')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();
    
    if (existingShow) {
      // Update existing show
      const { error } = await supabase
        .from('shows')
        .update(showData)
        .eq('id', event.id);
      
      if (error) {
        console.error(`Error updating show ${event.name}:`, error);
        return false;
      }
      
      console.log(`Updated show ${event.name} in database`);
      return true;
    } else {
      // Insert new show
      const { error } = await supabase
        .from('shows')
        .insert(showData);
      
      if (error) {
        console.error(`Error storing show ${event.name}:`, error);
        return false;
      }
      
      console.log(`Stored show ${event.name} in database`);
      return true;
    }
  } catch (error) {
    console.error(`Error storing show:`, error);
    return false;
  }
};

// Get trending shows based on view count
export async function getTrendingShows(limit: number = 6): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        *,
        artist:artists(name, image_url),
        venue:venues(name, city, state, country)
      `)
      .order('view_count', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching trending shows:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching trending shows:", error);
    return [];
  }
}
