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
 * This function handles the complete artist data flow
 */
export async function ensureArtistExists(artistInput: {
  id: string;
  name: string;
  ticketmaster_id?: string;
}): Promise<ArtistData | null> {
  try {
    console.log(`🎵 Ensuring artist exists: ${artistInput.name}`);

    // First, try to find artist by ticketmaster_id if provided
    if (artistInput.ticketmaster_id) {
      const { data: existingByTM } = await supabase
        .from('artists')
        .select('*')
        .eq('ticketmaster_id', artistInput.ticketmaster_id)
        .maybeSingle();

      if (existingByTM) {
        console.log(`✅ Artist ${artistInput.name} found by Ticketmaster ID`);
        return existingByTM;
      }
    }

    // Search for artist by name to see if we already have them
    const { data: existingByName } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', artistInput.name)
      .maybeSingle();

    if (existingByName) {
      console.log(`✅ Artist ${artistInput.name} found by name`);
      // Update ticketmaster_id if we have a new one
      if (artistInput.ticketmaster_id && !existingByName.ticketmaster_id) {
        await supabase
          .from('artists')
          .update({ ticketmaster_id: artistInput.ticketmaster_id })
          .eq('id', existingByName.id);
      }
      return existingByName;
    }

    // Artist doesn't exist, search Spotify for them
    console.log(`🔍 Searching Spotify for: ${artistInput.name}`);
    const spotifyResults = await spotifyService.searchArtists(artistInput.name);
    
    if (!spotifyResults || spotifyResults.length === 0) {
      console.log(`⚠️  No Spotify results for ${artistInput.name}`);
      return null;
    }

    // Find best match
    const spotifyArtist = spotifyResults.find(a => 
      a.name.toLowerCase() === artistInput.name.toLowerCase()
    ) || spotifyResults[0];

    console.log(`🎵 Found on Spotify: ${spotifyArtist.name} (${spotifyArtist.id})`);

    // Create new artist in database
    const newArtistData = {
      name: spotifyArtist.name,
      spotify_id: spotifyArtist.id,
      ticketmaster_id: artistInput.ticketmaster_id,
      image_url: spotifyArtist.images?.[0]?.url || null,
      popularity: spotifyArtist.popularity || 0,
      genres: spotifyArtist.genres || [],
      spotify_url: spotifyArtist.external_urls?.spotify || '',
      last_synced_at: new Date().toISOString()
    };

    const { data: newArtist, error } = await supabase
      .from('artists')
      .insert(newArtistData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating artist:', error);
      return null;
    }

    console.log(`✅ Created artist: ${newArtist.name}`);

    // Import their song catalog
    console.log(`📀 Importing song catalog for ${newArtist.name}...`);
    await spotifyService.importArtistCatalog(newArtist.id);

    return newArtist;

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
    console.log(`🏟️ Ensuring venue exists: ${venueInput.name}`);

    // Check if venue already exists by Ticketmaster ID
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('*')
      .eq('ticketmaster_id', venueInput.id)
      .maybeSingle();

    if (existingVenue) {
      console.log(`✅ Venue ${venueInput.name} already exists`);
      return existingVenue;
    }

    // Extract venue data
    const cityName = typeof venueInput.city === 'string' ? venueInput.city : venueInput.city?.name || 'Unknown City';
    const stateName = typeof venueInput.state === 'string' ? venueInput.state : venueInput.state?.name || null;
    const countryName = typeof venueInput.country === 'string' ? venueInput.country : venueInput.country?.name || 'Unknown Country';

    // Create new venue
    const newVenueData = {
      name: venueInput.name,
      ticketmaster_id: venueInput.id,
      city: cityName,
      state: stateName,
      country: countryName,
      address: venueInput.address?.line1 || null,
      latitude: venueInput.location?.latitude ? parseFloat(venueInput.location.latitude) : null,
      longitude: venueInput.location?.longitude ? parseFloat(venueInput.location.longitude) : null
    };

    const { data: newVenue, error } = await supabase
      .from('venues')
      .insert(newVenueData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating venue:', error);
      return null;
    }

    console.log(`✅ Created venue: ${newVenue.name}`);
    return newVenue;

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
    console.log(`🎤 Ensuring show exists: ${showInput.name}`);

    // Check if show already exists by Ticketmaster ID
    const { data: existingShow } = await supabase
      .from('shows')
      .select('*')
      .eq('ticketmaster_id', showInput.id)
      .maybeSingle();

    if (existingShow) {
      console.log(`✅ Show ${showInput.name} already exists`);
      return existingShow;
    }

    // Map status
    let status: 'scheduled' | 'postponed' | 'canceled' = 'scheduled';
    if (showInput.dates?.status?.code === 'cancelled') {
      status = 'canceled';
    } else if (showInput.dates?.status?.code === 'postponed') {
      status = 'postponed';
    }

    // Create new show
    const showDate = new Date(showInput.dates.start.localDate + (showInput.dates.start.localTime ? `T${showInput.dates.start.localTime}` : 'T00:00:00'));
    
    const newShowData = {
      artist_id: artistId,
      venue_id: venueId,
      ticketmaster_id: showInput.id,
      name: showInput.name,
      date: showDate.toISOString(),
      start_time: showInput.dates.start.localTime || null,
      status,
      ticketmaster_url: showInput.url || null,
      view_count: 0,
      trending_score: 0
    };

    const { data: newShow, error } = await supabase
      .from('shows')
      .insert(newShowData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating show:', error);
      return null;
    }

    console.log(`✅ Created show: ${newShow.name}`);
    
    // Create initial setlist for the show
    await createInitialSetlistForShow(newShow.id, artistId);
    
    return newShow;

  } catch (error) {
    console.error('❌ Error ensuring show exists:', error);
    return null;
  }
}

/**
 * Create initial setlist with 5 random songs
 */
async function createInitialSetlistForShow(showId: string, artistId: string): Promise<void> {
  try {
    // Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();

    if (existingSetlist) {
      return;
    }

    // Get 5 random songs from artist
    const { data: songs } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(20);

    if (!songs || songs.length === 0) {
      console.log('⚠️  No songs available for setlist');
      return;
    }

    // Randomly select 5 songs
    const selectedSongs = [];
    const songsCopy = [...songs];
    for (let i = 0; i < Math.min(5, songsCopy.length); i++) {
      const randomIndex = Math.floor(Math.random() * songsCopy.length);
      selectedSongs.push(songsCopy.splice(randomIndex, 1)[0]);
    }

    // Create setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        name: 'Main Set',
        order_index: 0,
        total_votes: 0
      })
      .select()
      .single();

    if (setlistError || !setlist) {
      console.error('❌ Error creating setlist:', setlistError);
      return;
    }

    // Add songs to setlist
    const setlistSongs = selectedSongs.map((song, index) => ({
      setlist_id: setlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0,
      is_encore: false
    }));

    await supabase.from('setlist_songs').insert(setlistSongs);
    console.log(`✅ Created setlist with ${selectedSongs.length} songs`);

  } catch (error) {
    console.error('❌ Error creating initial setlist:', error);
  }
}

/**
 * THE MAIN FUNCTION: Process a complete Ticketmaster event
 * This is the primary function that should be used when importing events
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

    // Step 1: Ensure artist exists
    const artist = await ensureArtistExists({
      id: attraction.id,
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

    console.log(`✅ Successfully processed event: ${event.name}`);
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
    return await ensureArtistExists({
      id: artistName, // This will be replaced by the actual ID from Spotify
      name: artistName
    });
  } catch (error) {
    console.error('Error finding or creating artist by name:', error);
    return null;
  }
}