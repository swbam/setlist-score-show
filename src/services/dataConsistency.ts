
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
 * The single source of truth for artist creation/ensuring
 * This function handles the complete artist data flow:
 * 1. Check if artist exists in DB
 * 2. If not, try to get from Spotify API with full data
 * 3. Store complete artist data including song catalog
 * 4. Return standardized artist data
 */
export async function ensureArtistExists(artistInput: {
  id: string;
  name: string;
  ticketmaster_id?: string;
}): Promise<ArtistData | null> {
  try {
    console.log(`🎵 Ensuring artist exists: ${artistInput.name} (${artistInput.id})`);

    // First check if artist already exists in database
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistInput.id)
      .maybeSingle();

    if (existingArtist) {
      console.log(`✅ Artist ${artistInput.name} already exists in database`);
      
      // Update ticketmaster_id if provided and missing
      if (artistInput.ticketmaster_id && !existingArtist.ticketmaster_id) {
        await supabase
          .from('artists')
          .update({ ticketmaster_id: artistInput.ticketmaster_id })
          .eq('id', artistInput.id);
      }
      
      return {
        id: existingArtist.id,
        name: existingArtist.name,
        image_url: existingArtist.image_url,
        popularity: existingArtist.popularity,
        genres: existingArtist.genres,
        spotify_url: existingArtist.spotify_url,
        ticketmaster_id: existingArtist.ticketmaster_id || artistInput.ticketmaster_id
      };
    }

    // Try to get full artist data from Spotify API
    console.log(`🔍 Fetching artist data from Spotify for: ${artistInput.name}`);
    const spotifyArtist = await spotifyService.getArtist(artistInput.id);
    
    if (spotifyArtist) {
      console.log(`📥 Storing complete artist data from Spotify: ${artistInput.name}`);
      
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

        // Import their song catalog synchronously to ensure songs exist
        console.log(`Importing song catalog for ${artistInput.name}...`);
        await spotifyService.importArtistCatalog(artistInput.id);

        console.log(`✅ Successfully created artist from Spotify: ${artistInput.name}`);
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
    console.log(`⚠️ Creating minimal artist record for: ${artistInput.name}`);
    const { error } = await supabase
      .from('artists')
      .insert({
        id: artistInput.id,
        name: artistInput.name,
        ticketmaster_id: artistInput.ticketmaster_id,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Error creating minimal artist record:', error);
      return null;
    }

    return {
      id: artistInput.id,
      name: artistInput.name,
      ticketmaster_id: artistInput.ticketmaster_id
    };

  } catch (error) {
    console.error('❌ Error ensuring artist exists:', error);
    return null;
  }
}

/**
 * The single source of truth for venue creation/ensuring
 */
export async function ensureVenueExists(venueInput: any): Promise<VenueData | null> {
  try {
    console.log(`🏟️ Ensuring venue exists: ${venueInput.name} (${venueInput.id})`);

    // Check if venue already exists
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueInput.id)
      .maybeSingle();

    if (existingVenue) {
      console.log(`✅ Venue ${venueInput.name} already exists in database`);
      return existingVenue;
    }

    // Create venue with comprehensive data
    console.log(`📥 Creating new venue: ${venueInput.name}`);
    const success = await ticketmasterService.storeVenueInDatabase(venueInput);
    if (!success) {
      console.error(`❌ Failed to store venue: ${venueInput.name}`);
      return null;
    }

    // Return the venue data
    const cityName = typeof venueInput.city === 'string' ? venueInput.city : venueInput.city?.name || 'Unknown City';
    const stateName = typeof venueInput.state === 'string' ? venueInput.state : venueInput.state?.name || null;
    const countryName = typeof venueInput.country === 'string' ? venueInput.country : venueInput.country?.name || 'Unknown Country';

    console.log(`✅ Successfully created venue: ${venueInput.name}`);
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
    console.error('❌ Error ensuring venue exists:', error);
    return null;
  }
}

/**
 * The single source of truth for show creation/ensuring
 */
export async function ensureShowExists(
  showInput: any,
  artistId: string,
  venueId: string
): Promise<ShowData | null> {
  try {
    console.log(`🎤 Ensuring show exists: ${showInput.name} (${showInput.id})`);

    // Check if show already exists
    const { data: existingShow } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showInput.id)
      .maybeSingle();

    if (existingShow) {
      console.log(`✅ Show ${showInput.name} already exists in database`);
      return existingShow as ShowData;
    }

    // Create show with comprehensive data
    console.log(`📥 Creating new show: ${showInput.name}`);
    const success = await ticketmasterService.storeShowInDatabase(showInput, artistId, venueId);
    if (!success) {
      console.error(`❌ Failed to store show: ${showInput.name}`);
      return null;
    }

    // Map status properly
    let status: 'scheduled' | 'postponed' | 'canceled' = 'scheduled';
    if (showInput.dates?.status?.code === 'cancelled') {
      status = 'canceled';
    } else if (showInput.dates?.status?.code === 'postponed') {
      status = 'postponed';
    }

    // Return the show data
    console.log(`✅ Successfully created show: ${showInput.name}`);
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
    console.error('❌ Error ensuring show exists:', error);
    return null;
  }
}

/**
 * THE MAIN FUNCTION: Process a complete Ticketmaster event
 * This is the primary function that should be used when importing events
 * It ensures all related data (artist, venue, show) exists with full data
 */
export async function processTicketmasterEvent(event: any): Promise<{
  artist: ArtistData | null;
  venue: VenueData | null;
  show: ShowData | null;
}> {
  try {
    console.log(`🎫 Processing Ticketmaster event: ${event.name}`);

    // Extract first attraction (artist)
    const attraction = event._embedded?.attractions?.[0];
    if (!attraction) {
      console.error(`❌ No attractions found for event: ${event.name}`);
      return { artist: null, venue: null, show: null };
    }

    // Extract venue
    const venue = event._embedded?.venues?.[0];
    if (!venue) {
      console.error(`❌ No venues found for event: ${event.name}`);
      return { artist: null, venue: null, show: null };
    }

    // Step 1: Find or create artist with Spotify mapping
    console.log(`🔍 Processing artist: ${attraction.name}`);
    let artistId = attraction.id;
    
    // Try to find if this is a Spotify artist by searching
    const spotifySearchResults = await spotifyService.searchArtists(attraction.name);
    if (spotifySearchResults.length > 0) {
      // Use the best match from Spotify for richer data
      const bestMatch = spotifySearchResults.find(a => 
        a.name.toLowerCase() === attraction.name.toLowerCase()
      ) || spotifySearchResults[0];
      
      artistId = bestMatch.id;
      console.log(`🎵 Found Spotify match: ${bestMatch.name} (${bestMatch.id})`);
    }

    const artist = await ensureArtistExists({
      id: artistId,
      name: attraction.name,
      ticketmaster_id: attraction.id
    });

    if (!artist) {
      console.error(`❌ Failed to create/find artist: ${attraction.name}`);
      return { artist: null, venue: null, show: null };
    }

    // Step 2: Ensure venue exists
    const venueData = await ensureVenueExists(venue);
    if (!venueData) {
      console.error(`❌ Failed to create/find venue: ${venue.name}`);
      return { artist, venue: null, show: null };
    }

    // Step 3: Ensure show exists
    const showData = await ensureShowExists(event, artist.id, venueData.id);
    if (!showData) {
      console.error(`❌ Failed to create/find show: ${event.name}`);
      return { artist, venue: venueData, show: null };
    }

    console.log(`✅ Successfully processed complete event: ${event.name}`);
    return { artist, venue: venueData, show: showData };

  } catch (error) {
    console.error('❌ Error processing Ticketmaster event:', error);
    return { artist: null, venue: null, show: null };
  }
}

/**
 * Helper function to search for artists by name and return existing or create new
 */
export async function findOrCreateArtistByName(artistName: string): Promise<ArtistData | null> {
  try {
    // First search Spotify for the artist
    const spotifyResults = await spotifyService.searchArtists(artistName);
    
    if (spotifyResults.length > 0) {
      const bestMatch = spotifyResults.find(a => 
        a.name.toLowerCase() === artistName.toLowerCase()
      ) || spotifyResults[0];
      
      return await ensureArtistExists({
        id: bestMatch.id,
        name: bestMatch.name
      });
    }
    
    return null;
  } catch (error) {
    console.error('Error finding or creating artist by name:', error);
    return null;
  }
}
