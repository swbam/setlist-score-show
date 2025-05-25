
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";
import * as spotifyService from "@/services/spotify";

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  popularity?: number;
  spotify_url?: string;
  ticketmaster_id?: string;
  source?: 'database' | 'ticketmaster' | 'spotify';
}

/**
 * Normalize artist ID to ensure consistency
 * This helps avoid duplicate artists with different ID formats
 */
export const normalizeArtistId = (artist: Artist): string => {
  // If it's a Spotify ID (typically 22 characters), use it directly
  if (artist.id && artist.id.length === 22) {
    return artist.id;
  }
  
  // If it has a spotify_url, extract the ID from it
  if (artist.spotify_url) {
    const spotifyUrlMatch = artist.spotify_url.match(/artist\/([a-zA-Z0-9]+)/);
    if (spotifyUrlMatch && spotifyUrlMatch[1]) {
      return spotifyUrlMatch[1];
    }
  }
  
  // Return the original ID if we can't normalize it
  // This should be a fallback for Ticketmaster IDs or other formats
  return artist.id;
};

/**
 * Find existing artist by name and Spotify ID
 * This helps with deduplication when we have artists from different sources
 */
export const findExistingArtist = async (artistName: string, spotifyId?: string): Promise<Artist | null> => {
  try {
    // First try to find by Spotify ID if available
    if (spotifyId) {
      const { data: spotifyArtist } = await supabase
        .from('artists')
        .select('*')
        .eq('id', spotifyId)
        .maybeSingle();
      
      if (spotifyArtist) {
        return { ...spotifyArtist, source: 'database' };
      }
    }
    
    // Then try to find by exact name match
    const { data: nameMatches } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', artistName)
      .limit(5);
    
    if (nameMatches && nameMatches.length > 0) {
      // Return the first exact match or closest match
      const exactMatch = nameMatches.find(a => a.name.toLowerCase() === artistName.toLowerCase());
      return exactMatch ? { ...exactMatch, source: 'database' } : { ...nameMatches[0], source: 'database' };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing artist:', error);
    return null;
  }
};

/**
 * Enhanced function to ensure artist data is consistently stored with proper ID mapping
 */
export const ensureArtistInDatabase = async (
  artist: Artist, 
  fetchSpotifyData = true
): Promise<Artist> => {
  try {
    // Skip if no valid ID or name
    if (!artist.id || !artist.name) {
      console.error("Invalid artist - missing ID or name");
      return artist;
    }
    
    // Check if this is a Ticketmaster artist that we need to map to Spotify
    let spotifyArtist = null;
    let finalArtistId = artist.id;
    
    // If this artist doesn't have a Spotify ID format, try to find it on Spotify
    if (fetchSpotifyData && artist.id.length !== 22) {
      console.log(`Looking up Spotify data for: ${artist.name}`);
      const searchResults = await spotifyService.searchArtists(artist.name);
      if (searchResults && searchResults.length > 0) {
        // Find the best match (exact name match preferred)
        spotifyArtist = searchResults.find(s => 
          s.name.toLowerCase() === artist.name.toLowerCase()
        ) || searchResults[0];
        
        if (spotifyArtist) {
          finalArtistId = spotifyArtist.id;
          console.log(`Found Spotify match: ${artist.name} -> ${finalArtistId}`);
        }
      }
    }
    
    // Check if artist exists in database using the final ID
    const existingArtist = await findExistingArtist(artist.name, finalArtistId);
    
    if (existingArtist) {
      console.log(`Artist ${artist.name} already exists in database`);
      
      // Update with any new information we have
      const updateData: any = {
        last_synced_at: new Date().toISOString()
      };
      
      // Add Spotify data if we found it and don't already have it
      if (spotifyArtist) {
        if (!existingArtist.spotify_url) {
          updateData.spotify_url = spotifyArtist.external_urls?.spotify;
        }
        if (!existingArtist.image_url && spotifyArtist.images?.[0]?.url) {
          updateData.image_url = spotifyArtist.images[0].url;
        }
        if (!existingArtist.genres && spotifyArtist.genres?.length > 0) {
          updateData.genres = spotifyArtist.genres;
        }
        if (!existingArtist.popularity) {
          updateData.popularity = spotifyArtist.popularity || 0;
        }
      }
      
      // Add Ticketmaster ID if this came from Ticketmaster and we don't have it
      if (artist.source === 'ticketmaster' && artist.id !== finalArtistId) {
        updateData.ticketmaster_id = artist.id;
      }
      
      // Update if we have new data
      if (Object.keys(updateData).length > 1) { // More than just last_synced_at
        const { error } = await supabase
          .from('artists')
          .update(updateData)
          .eq('id', existingArtist.id);
        
        if (error) {
          console.error(`Error updating artist ${artist.name}:`, error);
        } else {
          console.log(`Updated artist data for ${artist.name}`);
        }
      }
      
      return {
        ...existingArtist,
        ...updateData,
        source: 'database'
      };
    }
    
    // Artist doesn't exist, create new entry
    const artistData = {
      id: finalArtistId,
      name: artist.name,
      image_url: spotifyArtist?.images?.[0]?.url || artist.image_url || null,
      genres: spotifyArtist?.genres || artist.genres || [],
      popularity: spotifyArtist?.popularity || artist.popularity || 0,
      spotify_url: spotifyArtist?.external_urls?.spotify || artist.spotify_url || null,
      ticketmaster_id: artist.source === 'ticketmaster' ? artist.id : null,
      last_synced_at: new Date().toISOString()
    };
    
    // Create artist in database
    const { error } = await supabase
      .from('artists')
      .insert(artistData);
    
    if (error) {
      console.error(`Error storing artist ${artist.name}:`, error);
      return artist;
    }
    
    console.log(`Successfully stored new artist ${artist.name} with ID ${finalArtistId}`);
    
    // If this is a Spotify artist, import their catalog
    if (spotifyArtist && spotifyArtist.id) {
      spotifyService.importArtistCatalog(spotifyArtist.id).catch(console.error);
    }
    
    return {
      ...artistData,
      source: 'database'
    };
  } catch (error) {
    console.error(`Error ensuring artist ${artist.name} in database:`, error);
    return artist;
  }
};

// Existing function - now a wrapper around ensureArtistInDatabase
export const storeArtistInDatabase = async (artist: Artist): Promise<boolean> => {
  try {
    await ensureArtistInDatabase(artist);
    return true;
  } catch (error) {
    return false;
  }
};

// Extract unique artists from Ticketmaster events with consistent data handling
export const extractUniqueArtistsFromEvents = async (events: ticketmasterService.TicketmasterEvent[]): Promise<Artist[]> => {
  const artistMap = new Map<string, Artist>();
  
  for (const event of events) {
    const attractions = event._embedded?.attractions;
    if (!attractions) continue;
    
    // Process each artist/attraction
    for (const attraction of attractions) {
      if (!attraction || !attraction.name) continue;
      
      // Find a suitable image
      let imageUrl = null;
      if (attraction.images && attraction.images.length > 0) {
        const wideImage = attraction.images.find(img => img.ratio === '16_9');
        imageUrl = wideImage ? wideImage.url : attraction.images[0].url;
      }
      
      const artist: Artist = {
        id: attraction.id || `tm-${attraction.name}`,
        name: attraction.name,
        image_url: imageUrl,
        genres: [],
        popularity: 0,
        source: 'ticketmaster' as const
      };
      
      // Use normalized ID as the map key to avoid duplicates
      const normalizedId = normalizeArtistId(artist);
      if (!artistMap.has(normalizedId)) {
        artistMap.set(normalizedId, artist);
        // Store the artist in Supabase with Spotify enrichment
        await ensureArtistInDatabase(artist, true);
      }
    }
  }
  
  return Array.from(artistMap.values());
};

// Fetch artists from database
export const fetchArtistsFromDatabase = async (): Promise<Artist[]> => {
  const { data: dbArtists, error } = await supabase
    .from("artists")
    .select("*")
    .order("popularity", { ascending: false })
    .limit(40);
  
  if (error || !dbArtists) {
    console.error("Error fetching artists from database:", error);
    return [];
  }
  
  return dbArtists.map(artist => ({
    ...artist,
    source: 'database' as const
  }));
};

// Search artists from database by name
export const searchArtistsFromDatabase = async (query: string): Promise<Artist[]> => {
  const { data: dbArtists, error } = await supabase
    .from("artists")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(20);
  
  if (error || !dbArtists) {
    console.error("Error searching artists from database:", error);
    return [];
  }
  
  return dbArtists.map(artist => ({
    ...artist,
    source: 'database' as const
  }));
};

// Merge and sort artists from different sources
export const mergeArtists = (ticketmasterArtists: Artist[], databaseArtists: Artist[]): Artist[] => {
  const artistMap = new Map<string, Artist>();
  
  // Add Ticketmaster artists first
  for (const artist of ticketmasterArtists) {
    const normalizedId = normalizeArtistId(artist);
    artistMap.set(normalizedId, artist);
  }
  
  // Add database artists, overriding any duplicates from Ticketmaster
  for (const artist of databaseArtists) {
    const normalizedId = normalizeArtistId(artist);
    artistMap.set(normalizedId, artist);
  }
  
  // Convert to array and sort
  return Array.from(artistMap.values()).sort((a, b) => {
    // Database artists come first
    if (a.source === 'database' && b.source !== 'database') return -1;
    if (a.source !== 'database' && b.source === 'database') return 1;
    
    // Then sort by name
    return a.name.localeCompare(b.name);
  });
};

// Sort search results with better relevance
export const sortSearchResults = (artists: Artist[], searchQuery: string): Artist[] => {
  return [...artists].sort((a, b) => {
    // Database artists come first
    if (a.source === 'database' && b.source !== 'database') return -1;
    if (a.source !== 'database' && b.source === 'database') return 1;
    
    // Then sort by how well the name matches the search query
    const aStartsWith = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
    const bStartsWith = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
    
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
};
