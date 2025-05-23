
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "@/services/ticketmaster";

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  popularity?: number;
  source?: 'database' | 'ticketmaster';
}

// Store artist in Supabase database
export const storeArtistInDatabase = async (artist: Artist): Promise<boolean> => {
  try {
    // Skip if no valid ID
    if (!artist.id) return false;
    
    // Check if artist exists in database
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('id')
      .eq('id', artist.id)
      .maybeSingle();
    
    if (existingArtist) {
      console.log(`Artist ${artist.name} already exists in database`);
      return true; // Artist already exists
    }
    
    // Create artist in database with minimal information
    // Later sync processes can fetch more details from Spotify
    const { error } = await supabase
      .from('artists')
      .insert({
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url || null,
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
        spotify_url: null,
        last_synced_at: new Date().toISOString()
      });
    
    if (error) {
      console.error(`Error storing artist ${artist.name}:`, error);
      return false;
    }
    
    console.log(`Successfully stored artist ${artist.name} in database`);
    return true;
  } catch (error) {
    console.error(`Error storing artist ${artist.name}:`, error);
    return false;
  }
};

// Extract unique artists from Ticketmaster events
export const extractUniqueArtistsFromEvents = async (events: ticketmasterService.TicketmasterEvent[]): Promise<Artist[]> => {
  const artistMap = new Map<string, Artist>();
  
  for (const event of events) {
    const attractions = event._embedded?.attractions;
    if (!attractions) continue;
    
    // Process each artist/attraction
    for (const attraction of attractions) {
      if (!attraction || !attraction.name) continue;
      
      // Skip if we already processed this artist
      const artistKey = attraction.name.toLowerCase();
      if (artistMap.has(artistKey)) continue;
      
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
      
      artistMap.set(artistKey, artist);
      
      // Store the artist in Supabase
      await storeArtistInDatabase(artist);
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
    const artistKey = artist.name.toLowerCase();
    artistMap.set(artistKey, artist);
  }
  
  // Add database artists that aren't already in the map
  for (const artist of databaseArtists) {
    const artistKey = artist.name.toLowerCase();
    if (!artistMap.has(artistKey)) {
      artistMap.set(artistKey, artist);
    }
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
