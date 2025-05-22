
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
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY);
    url.searchParams.append("keyword", keyword);
    url.searchParams.append("size", "20");
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "date,asc");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to search events: ${response.status}`);
    }
    
    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

// Get events for a specific artist (by name or ID)
export async function getArtistEvents(artistName: string): Promise<TicketmasterEvent[]> {
  try {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY);
    url.searchParams.append("keyword", artistName);
    url.searchParams.append("size", "50");
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "date,asc");
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to get artist events: ${response.status}`);
    }
    
    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error("Error getting artist events:", error);
    return [];
  }
}

// Store venue in database
export async function storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
  try {
    const { error } = await supabase.from('venues').upsert({
      id: venue.id,
      name: venue.name,
      city: venue.city?.name || '',
      state: venue.state?.name || null,
      country: venue.country?.name || '',
      address: venue.address?.line1 || null,
      latitude: venue.location?.latitude || null,
      longitude: venue.location?.longitude || null
    });
    
    if (error) {
      console.error("Error storing venue in database:", error);
      return false;
    }
    
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
    const status = 
      event.dates.status?.code === 'cancelled' ? 'canceled' :
      event.dates.status?.code === 'postponed' ? 'postponed' : 'scheduled';
    
    const { error } = await supabase.from('shows').upsert({
      id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name,
      date: event.dates.start.dateTime,
      start_time: event.dates.start.localTime || null,
      status: status,
      ticketmaster_url: event.url || null
    });
    
    if (error) {
      console.error("Error storing show in database:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing show in database:", error);
    return false;
  }
}
