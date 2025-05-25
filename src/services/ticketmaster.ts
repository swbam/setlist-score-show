import { supabase } from "@/integrations/supabase/client";

const TICKETMASTER_API_KEY = "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";
const TICKETMASTER_BASE_URL = "https://app.ticketmaster.com/discovery/v2";

// Export the TicketmasterEvent interface
export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    status?: {
      code: string;
    };
  };
  url?: string;
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      city: any;
      state: any;
      country: any;
      address?: {
        line1?: string;
      };
      location?: {
        latitude?: string;
        longitude?: string;
      };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
    }>;
  };
}

// Helper function to safely extract city name
function extractCityName(city: any): string {
  if (typeof city === 'string') {
    return city;
  }
  if (city && typeof city === 'object' && city.name) {
    return city.name;
  }
  return '';
}

// Helper function to safely extract state name
function extractStateName(state: any): string | null {
  if (typeof state === 'string') {
    return state;
  }
  if (state && typeof state === 'object' && state.name) {
    return state.name;
  }
  return null;
}

// Helper function to safely extract country name
function extractCountryName(country: any): string {
  if (typeof country === 'string') {
    return country;
  }
  if (country && typeof country === 'object' && country.name) {
    return country.name;
  }
  return '';
}

// Store venue in database with improved data extraction
export async function storeVenueInDatabase(venue: any): Promise<boolean> {
  try {
    console.log("Storing venue:", venue.id, venue.name);
    
    // Validate required venue data
    if (!venue.id || !venue.name) {
      console.error("Missing required venue data:", venue);
      return false;
    }

    // Extract location data safely
    const city = extractCityName(venue.city);
    const state = extractStateName(venue.state);
    const country = extractCountryName(venue.country);
    
    if (!city) {
      console.error("Missing required venue city data:", venue);
      return false;
    }

    const venueData = {
      id: venue.id,
      name: venue.name,
      city: city,
      state: state,
      country: country || 'US', // Default to US if no country provided
      address: venue.address?.line1 || null,
      latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
      longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
    };

    const { error } = await supabase
      .from('venues')
      .upsert(venueData, { onConflict: 'id' });

    if (error) {
      console.error("Error storing venue:", error);
      return false;
    }

    console.log("Successfully stored venue:", venue.id);
    return true;
  } catch (error) {
    console.error("Error in storeVenueInDatabase:", error);
    return false;
  }
}

// Store show in database with improved error handling
export async function storeShowInDatabase(event: any, artistId: string, venueId: string): Promise<boolean> {
  try {
    console.log("Storing show:", event.id, event.name);
    
    // Validate required data
    if (!event.id || !artistId || !venueId) {
      console.error("Missing required show data:", { eventId: event.id, artistId, venueId });
      return false;
    }

    // Validate date
    const showDate = event.dates?.start?.dateTime || event.dates?.start?.localDate;
    if (!showDate) {
      console.error("Missing show date:", event);
      return false;
    }

    const showData = {
      id: event.id,
      artist_id: artistId,
      venue_id: venueId,
      name: event.name || null,
      date: showDate,
      start_time: event.dates?.start?.localTime || null,
      status: event.dates?.status?.code === 'cancelled' ? 'canceled' : 
             event.dates?.status?.code === 'postponed' ? 'postponed' : 'scheduled',
      ticketmaster_url: event.url || null,
      view_count: 0
    };

    const { error } = await supabase
      .from('shows')
      .upsert(showData, { onConflict: 'id' });

    if (error) {
      console.error("Error storing show:", error);
      return false;
    }

    console.log("Successfully stored show:", event.id);
    return true;
  } catch (error) {
    console.error("Error in storeShowInDatabase:", error);
    return false;
  }
}

// Get artist events from Ticketmaster
export async function getArtistEvents(artistName: string): Promise<any[]> {
  try {
    console.log("Fetching events for artist:", artistName);
    
    const response = await fetch(
      `${TICKETMASTER_BASE_URL}/events.json?keyword=${encodeURIComponent(artistName)}&apikey=${TICKETMASTER_API_KEY}&size=50&sort=date,asc`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data._embedded?.events) {
      console.log("No events found for artist:", artistName);
      return [];
    }

    console.log(`Found ${data._embedded.events.length} events for ${artistName}`);
    return data._embedded.events;
  } catch (error) {
    console.error("Error fetching artist events:", error);
    return [];
  }
}

// Get popular events
export async function getPopularEvents(limit: number = 20): Promise<any[]> {
  try {
    console.log("Fetching popular events");
    
    const response = await fetch(
      `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&size=${limit}&sort=relevance,desc&classificationName=music`
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data._embedded?.events) {
      console.log("No popular events found");
      return [];
    }

    console.log(`Found ${data._embedded.events.length} popular events`);
    return data._embedded.events;
  } catch (error) {
    console.error("Error fetching popular events:", error);
    return [];
  }
}

// Search events
export async function searchEvents(query: string, location?: string): Promise<any[]> {
  try {
    console.log("Searching events:", query, location);
    
    let url = `${TICKETMASTER_BASE_URL}/events.json?keyword=${encodeURIComponent(query)}&apikey=${TICKETMASTER_API_KEY}&size=50&sort=relevance,desc`;
    
    if (location) {
      url += `&city=${encodeURIComponent(location)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data._embedded?.events) {
      console.log("No events found for search:", query);
      return [];
    }

    console.log(`Found ${data._embedded.events.length} events for search: ${query}`);
    return data._embedded.events;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}
