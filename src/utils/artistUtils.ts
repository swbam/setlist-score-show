
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

// Comprehensive function to ensure artist data is consistently stored in database
export const ensureArtistInDatabase = async (
  artist: Artist, 
  fetchSpotifyData = false
): Promise<Artist> => {
  try {
    // Skip if no valid ID
    if (!artist.id) {
      console.error("Invalid artist ID");
      return artist;
    }
    
    // Normalize artist ID
    const normalizedId = normalizeArtistId(artist);
    
    // Check if artist exists in database using the normalized ID
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('*')
      .eq('id', normalizedId)
      .maybeSingle();
    
    if (existingArtist) {
      console.log(`Artist ${artist.name} already exists in database`);
      
      // If we have Spotify info but DB doesn't, or if fetchSpotifyData is true, update it
      if ((artist.spotify_url && !existingArtist.spotify_url) || 
          (fetchSpotifyData && !existingArtist.spotify_url)) {
        
        // Try to enrich with Spotify data if needed
        let spotifyArtist = null;
        if (fetchSpotifyData) {
          // First try by ID in case it's already a Spotify ID
          spotifyArtist = await spotifyService.getArtist(normalizedId);
          
          // If not found by ID, search by name
          if (!spotifyArtist) {
            const searchResults = await spotifyService.searchArtists(artist.name);
            if (searchResults && searchResults.length > 0) {
              spotifyArtist = searchResults[0];
            }
          }
        }
        
        // Update with enriched data
        if (spotifyArtist) {
          const { error } = await supabase
            .from('artists')
            .update({
              spotify_url: spotifyArtist.external_urls?.spotify || artist.spotify_url || null,
              image_url: spotifyArtist.images?.[0]?.url || existingArtist.image_url,
              genres: spotifyArtist.genres || existingArtist.genres,
              popularity: spotifyArtist.popularity || existingArtist.popularity,
              last_synced_at: new Date().toISOString()
            })
            .eq('id', normalizedId);
          
          if (error) {
            console.error(`Error updating Spotify data for artist ${artist.name}:`, error);
          } else {
            console.log(`Updated Spotify data for artist ${artist.name}`);
            
            // Import tracks if this is a Spotify artist
            if (spotifyArtist.id && spotifyArtist.id.length > 0) {
              spotifyService.importArtistCatalog(spotifyArtist.id).catch(console.error);
            }
          }
        }
      }
      
      // Return existing artist with any updated fields
      return {
        ...existingArtist,
        source: 'database'
      };
    }
    
    // Artist doesn't exist, try to enrich with Spotify data first
    let spotifyArtist = null;
    if (fetchSpotifyData) {
      const searchResults = await spotifyService.searchArtists(artist.name);
      if (searchResults && searchResults.length > 0) {
        spotifyArtist = searchResults[0];
      }
    }
    
    // Use Spotify ID if available, otherwise use normalized ID
    const finalArtistId = spotifyArtist?.id || normalizedId;
    
    // Prepare data for insert
    const artistData = {
      id: finalArtistId,
      name: artist.name,
      image_url: spotifyArtist?.images?.[0]?.url || artist.image_url || null,
      genres: spotifyArtist?.genres || artist.genres || [],
      popularity: spotifyArtist?.popularity || artist.popularity || 0,
      spotify_url: spotifyArtist?.external_urls?.spotify || artist.spotify_url || null,
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
    
    console.log(`Successfully stored artist ${artist.name} in database`);
    
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
