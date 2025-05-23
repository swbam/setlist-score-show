import { supabase } from "@/integrations/supabase/client";

// Ticketmaster API key
const TICKETMASTER_API_KEY = "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";

// Types for Ticketmaster API responses
export interface TicketmasterVenue {
  id: string;
  name: string;
  city: {
    name: string;
  };
  state: {
    name: string;
  };
  country: {
    name: string;
  };
  address: {
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
      dateTime: string;
      localTime?: string;
    };
    status: {
      code: string;
    };
  };
  images: { url: string; ratio?: string; width?: number; height?: number }[];
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

// Store venue in database
export async function storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
  try {
    console.log("Storing venue in database:", venue.name);
    
    const venueData = {
      id: venue.id,
      name: venue.name,
      city: venue.city?.name || '',
      state: venue.state?.name || null,
      country: venue.country?.name || '',
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
export async function storeShowInDatabase(
  event: TicketmasterEvent, 
  artistId: string, 
  venueId: string
): Promise<boolean> {
  try {
    console.log("Storing show in database:", event.name);
    
    const status = 
      event.dates.status?.code === 'cancelled' ? 'canceled' :
      event.dates.status?.code === 'postponed' ? 'postponed' : 'scheduled';
    
    // Find a good image
    let imageUrl = null;
    if (event.images && event.images.length > 0) {
      // Try to find a 16:9 ratio image first
      const wideImage = event.images.find(img => img.ratio === '16_9');
      // Otherwise use the first image
      imageUrl = wideImage ? wideImage.url : event.images[0].url;
    }
    
    const showData = {
      id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name,
      date: event.dates.start.dateTime,
      start_time: event.dates.start.localTime || null,
      status: status,
      ticketmaster_url: event.url || null,
      view_count: 0 // Initialize view count to 0
    };
    
    console.log("Show data to store:", showData);
    
    const { error } = await supabase
      .from('shows')
      .upsert(showData, { onConflict: 'id' });
    
    if (error) {
      console.error("Error storing show in database:", error);
      return false;
    }
    
    console.log("Successfully stored show:", event.name);
    return true;
  } catch (error) {
    console.error("Error storing show in database:", error);
    return false;
  }
}

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
