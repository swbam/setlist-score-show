
import { supabase } from "@/integrations/supabase/client";

const TICKETMASTER_API_KEY = "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";
const TICKETMASTER_API_BASE = "https://app.ticketmaster.com/discovery/v2";

// Ticketmaster API Types
export interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url?: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    status: {
      code: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface TicketmasterVenue {
  id: string;
  name: string;
  type: string;
  url?: string;
  address?: {
    line1?: string;
    line2?: string;
  };
  city: {
    name: string;
  };
  state?: {
    name: string;
    stateCode: string;
  };
  country: {
    name: string;
    countryCode: string;
  };
  location?: {
    longitude: string;
    latitude: string;
  };
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  type: string;
  url?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  classifications?: Array<{
    primary: boolean;
    segment: {
      id: string;
      name: string;
    };
    genre: {
      id: string;
      name: string;
    };
    subGenre: {
      id: string;
      name: string;
    };
  }>;
  externalLinks?: {
    spotify?: Array<{
      url: string;
    }>;
  };
}

export interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Search for events by artist name
export async function searchEvents(artistName: string, limit: number = 20): Promise<TicketmasterEvent[]> {
  try {
    console.log("Searching Ticketmaster for events by artist:", artistName);
    
    const url = `${TICKETMASTER_API_BASE}/events.json?keyword=${encodeURIComponent(artistName)}&apikey=${TICKETMASTER_API_KEY}&size=${limit}&sort=date,asc`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }
    
    const data: TicketmasterResponse = await response.json();
    
    if (data._embedded?.events) {
      console.log(`Found ${data._embedded.events.length} events for ${artistName}`);
      return data._embedded.events;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching Ticketmaster events:", error);
    return [];
  }
}

// Get popular events
export async function getPopularEvents(limit: number = 50): Promise<TicketmasterEvent[]> {
  try {
    console.log("Fetching popular events from Ticketmaster");
    
    const url = `${TICKETMASTER_API_BASE}/events.json?apikey=${TICKETMASTER_API_KEY}&size=${limit}&sort=relevance,desc&classificationName=music`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }
    
    const data: TicketmasterResponse = await response.json();
    
    if (data._embedded?.events) {
      console.log(`Found ${data._embedded.events.length} popular events`);
      return data._embedded.events;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching popular events:", error);
    return [];
  }
}

// Store venue in database
export async function storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
  try {
    const venueData = {
      id: venue.id,
      name: venue.name,
      city: venue.city.name,
      state: venue.state?.name || null,
      country: venue.country.name,
      address: venue.address?.line1 || null,
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
    };
    
    const { error } = await supabase
      .from('venues')
      .upsert(venueData);
    
    if (error) {
      console.error("Error storing venue:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing venue in database:", error);
    return false;
  }
}

// Store show in database
export async function storeShowInDatabase(event: TicketmasterEvent, artistId: string, venueId: string): Promise<boolean> {
  try {
    const showData = {
      id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name,
      date: new Date(event.dates.start.localDate + (event.dates.start.localTime ? `T${event.dates.start.localTime}` : 'T00:00:00')).toISOString(),
      start_time: event.dates.start.localTime || null,
      status: event.dates.status.code === 'onsale' ? 'scheduled' : 'postponed',
      ticketmaster_url: event.url || null
    };
    
    const { error } = await supabase
      .from('shows')
      .upsert(showData);
    
    if (error) {
      console.error("Error storing show:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing show in database:", error);
    return false;
  }
}
