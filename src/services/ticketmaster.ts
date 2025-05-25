
import { supabase } from "@/integrations/supabase/client";

// Ticketmaster API key
const TICKETMASTER_API_KEY = "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";

// Types for Ticketmaster API responses
export interface TicketmasterVenue {
  id: string;
  name: string;
  city?: {
    name: string;
  } | string;
  state?: {
    name: string;
  } | string;
  country?: {
    name: string;
  } | string;
  address?: {
    line1: string;
  } | string;
  location?: {
    latitude: number | string;
    longitude: number | string;
  };
  // Additional fields we might encounter
  url?: string;
  locale?: string;
  timezone?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      dateTime?: string;
      localDate?: string;
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

// Helper function to safely extract venue data
function extractVenueData(venue: any): {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
} | null {
  try {
    // Validate required fields
    if (!venue || !venue.id || !venue.name) {
      console.error("Missing required venue fields:", venue);
      return null;
    }

    // Extract city - handle both object and string formats
    let city = '';
    if (typeof venue.city === 'object' && venue.city?.name) {
      city = venue.city.name;
    } else if (typeof venue.city === 'string') {
      city = venue.city;
    } else {
      console.error("No valid city found for venue:", venue);
      return null;
    }

    // Extract state - handle both object and string formats
    let state = null;
    if (typeof venue.state === 'object' && venue.state?.name) {
      state = venue.state.name;
    } else if (typeof venue.state === 'string') {
      state = venue.state;
    }

    // Extract country - handle both object and string formats
    let country = '';
    if (typeof venue.country === 'object' && venue.country?.name) {
      country = venue.country.name;
    } else if (typeof venue.country === 'string') {
      country = venue.country;
    } else {
      // Default to empty string if no country specified
      country = '';
    }

    // Extract address - handle both object and string formats
    let address = null;
    if (typeof venue.address === 'object' && venue.address?.line1) {
      address = venue.address.line1;
    } else if (typeof venue.address === 'string') {
      address = venue.address;
    }

    // Extract coordinates
    let latitude = null;
    let longitude = null;
    if (venue.location) {
      if (venue.location.latitude) {
        latitude = typeof venue.location.latitude === 'string' 
          ? parseFloat(venue.location.latitude) 
          : venue.location.latitude;
      }
      if (venue.location.longitude) {
        longitude = typeof venue.location.longitude === 'string' 
          ? parseFloat(venue.location.longitude) 
          : venue.location.longitude;
      }
    }

    return {
      id: venue.id,
      name: venue.name,
      city,
      state,
      country,
      address,
      latitude,
      longitude
    };
  } catch (error) {
    console.error("Error extracting venue data:", error, venue);
    return null;
  }
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

// Store venue in database with improved error handling
export async function storeVenueInDatabase(venue: any): Promise<boolean> {
  try {
    console.log("Processing venue for database storage:", venue?.name || venue?.id);
    
    const venueData = extractVenueData(venue);
    if (!venueData) {
      console.error("Failed to extract venue data:", venue);
      return false;
    }
    
    console.log("Storing venue in database:", venueData.name);
    console.log("Venue data to store:", venueData);
    
    const { error } = await supabase
      .from('venues')
      .upsert(venueData, { onConflict: 'id' });
    
    if (error) {
      console.error("Error storing venue in database:", error);
      return false;
    }
    
    console.log("Successfully stored venue:", venueData.name);
    return true;
  } catch (error) {
    console.error("Error storing venue in database:", error);
    return false;
  }
}

// Store show in database with improved validation and error handling
export const storeShowInDatabase = async (
  event: TicketmasterEvent,
  artistId: string,
  venueId: string
): Promise<boolean> => {
  try {
    console.log(`Storing show ${event.name} for artist ${artistId} at venue ${venueId}`);
    
    // Check if artist exists in the database
    const { data: artistExists } = await supabase
      .from('artists')
      .select('id')
      .eq('id', artistId)
      .maybeSingle();
    
    // If artist doesn't exist with that ID, try to find them by name
    if (!artistExists) {
      console.warn(`Artist with ID ${artistId} not found in database.`);
      // This could happen if we're using a Ticketmaster ID but the artist was stored with Spotify ID
      // Try to find by name using the event information
      if (event._embedded?.attractions?.[0]?.name) {
        const { data: artistByName } = await supabase
          .from('artists')
          .select('id')
          .ilike('name', event._embedded.attractions[0].name)
          .maybeSingle();
        
        if (artistByName) {
          artistId = artistByName.id;
          console.log(`Found artist by name instead: ${artistId}`);
        } else {
          console.error(`Could not find artist ${event._embedded.attractions[0].name} in database`);
          return false;
        }
      } else {
        return false;
      }
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
    
    // Validate and format the date
    const showDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
    if (!showDate) {
      console.error(`No valid date found for event ${event.name}. Event dates:`, event.dates);
      return false;
    }

    // Convert date to ISO string for database storage
    let formattedDate: string;
    try {
      if (event.dates.start.dateTime) {
        // Full datetime
        formattedDate = new Date(event.dates.start.dateTime).toISOString();
      } else if (event.dates.start.localDate) {
        // Date only - assume start of day
        formattedDate = new Date(event.dates.start.localDate + 'T00:00:00Z').toISOString();
      } else {
        throw new Error('No valid date format found');
      }
    } catch (dateError) {
      console.error(`Invalid date format for event ${event.name}:`, showDate, dateError);
      return false;
    }
    
    // Format the show data
    const showData = {
      id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name || null,
      date: formattedDate,
      start_time: event.dates?.start?.localTime || null,
      status: event.dates?.status?.code === 'cancelled' ? 'canceled' : 
             event.dates?.status?.code === 'postponed' ? 'postponed' : 'scheduled',
      ticketmaster_url: event.url || null,
      view_count: 0
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
