
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";
import * as ticketmasterService from "./ticketmaster";

export interface ArtistData {
  id: string;
  name: string;
  image_url?: string;
  popularity?: number;
  genres?: string[];
  spotify_url?: string;
  ticketmaster_id?: string;
}

export interface VenueData {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShowData {
  id: string;
  artist_id: string;
  venue_id: string;
  name?: string;
  date: string;
  start_time?: string;
  status: 'scheduled' | 'postponed' | 'canceled';
  ticketmaster_url?: string;
  view_count: number;
}

/**
 * Ensures an artist exists in the database with all required fields
 * This function is the single source of truth for artist creation
 */
export async function ensureArtistExists(artistInput: {
  id: string;
  name: string;
  ticketmaster_id?: string;
}): Promise<ArtistData | null> {
  try {
    console.log(`Ensuring artist exists: ${artistInput.name} (${artistInput.id})`);

    // First check if artist already exists in database
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistInput.id)
      .maybeSingle();

    if (existingArtist) {
      console.log(`Artist ${artistInput.name} already exists in database`);
      return {
        id: existingArtist.id,
        name: existingArtist.name,
        image_url: existingArtist.image_url,
        popularity: existingArtist.popularity,
        genres: existingArtist.genres,
        spotify_url: existingArtist.spotify_url,
        ticketmaster_id: existingArtist.ticketmaster_id
      };
    }

    // Try to get full artist data from Spotify
    const spotifyArtist = await spotifyService.getArtist(artistInput.id);
    
    if (spotifyArtist) {
      // Store complete artist data from Spotify
      const success = await spotifyService.storeArtistInDatabase(spotifyArtist);
      if (success) {
        // Update with ticketmaster_id if provided
        if (artistInput.ticketmaster_id) {
          await supabase
            .from('artists')
            .update({ ticketmaster_id: artistInput.ticketmaster_id })
            .eq('id', artistInput.id);
        }

        // Also import their song catalog
        await spotifyService.importArtistCatalog(artistInput.id);

        console.log(`Successfully created artist from Spotify: ${artistInput.name}`);
        return {
          id: spotifyArtist.id,
          name: spotifyArtist.name,
          image_url: spotifyArtist.images?.[0]?.url,
          popularity: spotifyArtist.popularity,
          genres: spotifyArtist.genres,
          spotify_url: spotifyArtist.external_urls?.spotify,
          ticketmaster_id: artistInput.ticketmaster_id
        };
      }
    }

    // If Spotify fails, create minimal artist record
    console.log(`Creating minimal artist record for: ${artistInput.name}`);
    const { error } = await supabase
      .from('artists')
      .insert({
        id: artistInput.id,
        name: artistInput.name,
        ticketmaster_id: artistInput.ticketmaster_id,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating minimal artist record:', error);
      return null;
    }

    return {
      id: artistInput.id,
      name: artistInput.name,
      ticketmaster_id: artistInput.ticketmaster_id
    };

  } catch (error) {
    console.error('Error ensuring artist exists:', error);
    return null;
  }
}

/**
 * Ensures a venue exists in the database with all required fields
 * This function is the single source of truth for venue creation
 */
export async function ensureVenueExists(venueInput: ticketmasterService.TicketmasterVenue): Promise<VenueData | null> {
  try {
    console.log(`Ensuring venue exists: ${venueInput.name} (${venueInput.id})`);

    // Check if venue already exists
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueInput.id)
      .maybeSingle();

    if (existingVenue) {
      console.log(`Venue ${venueInput.name} already exists in database`);
      return existingVenue;
    }

    // Create venue with comprehensive data
    const success = await ticketmasterService.storeVenueInDatabase(venueInput);
    if (!success) {
      console.error(`Failed to store venue: ${venueInput.name}`);
      return null;
    }

    // Return the venue data
    const cityName = typeof venueInput.city === 'string' ? venueInput.city : venueInput.city?.name || 'Unknown City';
    const stateName = typeof venueInput.state === 'string' ? venueInput.state : venueInput.state?.name || null;
    const countryName = typeof venueInput.country === 'string' ? venueInput.country : venueInput.country?.name || 'Unknown Country';

    return {
      id: venueInput.id,
      name: venueInput.name,
      city: cityName,
      state: stateName,
      country: countryName,
      address: venueInput.address?.line1 || null,
      latitude: venueInput.location?.latitude ? parseFloat(venueInput.location.latitude) : null,
      longitude: venueInput.location?.longitude ? parseFloat(venueInput.location.longitude) : null
    };

  } catch (error) {
    console.error('Error ensuring venue exists:', error);
    return null;
  }
}

/**
 * Ensures a show exists in the database with all required fields
 * This function is the single source of truth for show creation
 */
export async function ensureShowExists(
  showInput: ticketmasterService.TicketmasterEvent,
  artistId: string,
  venueId: string
): Promise<ShowData | null> {
  try {
    console.log(`Ensuring show exists: ${showInput.name} (${showInput.id})`);

    // Check if show already exists
    const { data: existingShow } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showInput.id)
      .maybeSingle();

    if (existingShow) {
      console.log(`Show ${showInput.name} already exists in database`);
      return existingShow;
    }

    // Create show with comprehensive data
    const success = await ticketmasterService.storeShowInDatabase(showInput, artistId, venueId);
    if (!success) {
      console.error(`Failed to store show: ${showInput.name}`);
      return null;
    }

    // Map status properly
    let status: 'scheduled' | 'postponed' | 'canceled' = 'scheduled';
    if (showInput.dates.status.code === 'cancelled') {
      status = 'canceled';
    } else if (showInput.dates.status.code === 'postponed') {
      status = 'postponed';
    }

    // Return the show data
    return {
      id: showInput.id,
      artist_id: artistId,
      venue_id: venueId,
      name: showInput.name,
      date: new Date(showInput.dates.start.localDate + (showInput.dates.start.localTime ? `T${showInput.dates.start.localTime}` : 'T00:00:00')).toISOString(),
      start_time: showInput.dates.start.localTime || null,
      status,
      ticketmaster_url: showInput.url || null,
      view_count: 0
    };

  } catch (error) {
    console.error('Error ensuring show exists:', error);
    return null;
  }
}

/**
 * Process a Ticketmaster event and ensure all related data exists
 * This is the main function to use when importing events from Ticketmaster
 */
export async function processTicketmasterEvent(event: ticketmasterService.TicketmasterEvent): Promise<{
  artist: ArtistData | null;
  venue: VenueData | null;
  show: ShowData | null;
}> {
  try {
    console.log(`Processing Ticketmaster event: ${event.name}`);

    // Extract first attraction (artist)
    const attraction = event._embedded?.attractions?.[0];
    if (!attraction) {
      console.error(`No attractions found for event: ${event.name}`);
      return { artist: null, venue: null, show: null };
    }

    // Extract venue
    const venue = event._embedded?.venues?.[0];
    if (!venue) {
      console.error(`No venues found for event: ${event.name}`);
      return { artist: null, venue: null, show: null };
    }

    // 1. Ensure artist exists (try to find Spotify mapping)
    console.log(`Processing artist: ${attraction.name}`);
    let artistId = attraction.id;
    
    // Try to find if this is a Spotify artist
    const spotifySearchResults = await spotifyService.searchArtists(attraction.name);
    if (spotifySearchResults.length > 0) {
      // Use the Spotify artist ID for better data
      artistId = spotifySearchResults[0].id;
    }

    const artist = await ensureArtistExists({
      id: artistId,
      name: attraction.name,
      ticketmaster_id: attraction.id
    });

    if (!artist) {
      console.error(`Failed to create/find artist: ${attraction.name}`);
      return { artist: null, venue: null, show: null };
    }

    // 2. Ensure venue exists
    const venueData = await ensureVenueExists(venue);
    if (!venueData) {
      console.error(`Failed to create/find venue: ${venue.name}`);
      return { artist, venue: null, show: null };
    }

    // 3. Ensure show exists
    const showData = await ensureShowExists(event, artist.id, venueData.id);
    if (!showData) {
      console.error(`Failed to create/find show: ${event.name}`);
      return { artist, venue: venueData, show: null };
    }

    console.log(`Successfully processed event: ${event.name}`);
    return { artist, venue: venueData, show: showData };

  } catch (error) {
    console.error('Error processing Ticketmaster event:', error);
    return { artist: null, venue: null, show: null };
  }
}
