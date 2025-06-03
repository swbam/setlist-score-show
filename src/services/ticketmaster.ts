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

// Get events for a specific artist
export async function getArtistEvents(artistName: string): Promise<TicketmasterEvent[]> {
  try {
    console.log(`Fetching events for artist: ${artistName}`);
    
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(artistName)}&classificationName=music&size=50&sort=date,asc`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data._embedded?.events) {
      console.log(`No events found for artist: ${artistName}`);
      return [];
    }

    return data._embedded.events;
  } catch (error) {
    console.error(`Error fetching events for ${artistName}:`, error);
    return [];
  }
}

// Store venue in database
export async function storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
  try {
    // Ensure venue has a name, use a fallback if missing
    const venueName = venue.name || 'Unknown Venue';
    
    // Safely extract string values from Ticketmaster venue object
    const cityName = typeof venue.city === 'string' ? venue.city : venue.city?.name || 'Unknown City';
    const stateName = typeof venue.state === 'string' ? venue.state : venue.state?.name || null;
    const countryName = typeof venue.country === 'string' ? venue.country : venue.country?.name || 'Unknown Country';
    
    const venueData = {
      id: venue.id,
      name: venueName,
      city: cityName,
      state: stateName,
      country: countryName,
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
    // Ensure venue exists before creating show
    const { data: venueExists } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .single();
    
    if (!venueExists) {
      console.error(`Venue ${venueId} does not exist, cannot create show`);
      return false;
    }
    
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

// Search for events with additional options
export async function searchEvents(keyword: string, options: {
  size?: number;
  page?: number;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  startDateTime?: string;
  endDateTime?: string;
} = {}): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    params.append('apikey', TICKETMASTER_API_KEY);
    params.append('keyword', keyword);
    params.append('size', (options.size || 20).toString());
    params.append('page', (options.page || 0).toString());
    params.append('classificationName', 'Music');
    params.append('sort', 'date,asc');
    
    // Add optional parameters
    if (options.countryCode) params.append('countryCode', options.countryCode);
    if (options.stateCode) params.append('stateCode', options.stateCode);
    if (options.city) params.append('city', options.city);
    if (options.startDateTime) params.append('startDateTime', options.startDateTime);
    if (options.endDateTime) params.append('endDateTime', options.endDateTime);

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error('Error searching Ticketmaster events:', error);
    return [];
  }
}

// Export service object for compatibility
export const ticketmasterService = {
  searchEvents,
  getPopularEvents
};
