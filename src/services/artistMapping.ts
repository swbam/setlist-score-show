
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";

/**
 * Service to handle mapping between Ticketmaster and Spotify artist IDs
 */

export interface ArtistMapping {
  spotify_id: string;
  ticketmaster_id: string;
  artist_name: string;
  confidence_score: number;
}

/**
 * Find Spotify artist for a Ticketmaster artist
 */
export const findSpotifyArtistForTicketmaster = async (
  ticketmasterArtistId: string,
  artistName: string
): Promise<string | null> => {
  try {
    // First check if we already have this mapping in the database
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('id, spotify_url')
      .eq('ticketmaster_id', ticketmasterArtistId)
      .maybeSingle();
    
    if (existingArtist) {
      return existingArtist.id;
    }
    
    // Search for the artist on Spotify
    const spotifyResults = await spotifyService.searchArtists(artistName);
    
    if (spotifyResults.length > 0) {
      // Find the best match
      const exactMatch = spotifyResults.find((artist: any) => 
        artist.name.toLowerCase() === artistName.toLowerCase()
      );
      
      const bestMatch = exactMatch || spotifyResults[0];
      
      // Store this mapping for future use
      const { error } = await supabase
        .from('artists')
        .upsert({
          id: bestMatch.id,
          name: bestMatch.name,
          image_url: bestMatch.images?.[0]?.url,
          genres: bestMatch.genres,
          popularity: bestMatch.popularity,
          spotify_url: bestMatch.external_urls?.spotify,
          ticketmaster_id: ticketmasterArtistId,
          last_synced_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error storing artist mapping:', error);
      } else {
        console.log(`Mapped Ticketmaster artist ${artistName} to Spotify ID ${bestMatch.id}`);
      }
      
      return bestMatch.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding Spotify artist for Ticketmaster:', error);
    return null;
  }
};

/**
 * Batch process artist mappings
 */
export const batchProcessArtistMappings = async (
  artists: Array<{ ticketmaster_id: string; name: string }>
): Promise<ArtistMapping[]> => {
  const mappings: ArtistMapping[] = [];
  
  for (const artist of artists) {
    const spotifyId = await findSpotifyArtistForTicketmaster(
      artist.ticketmaster_id,
      artist.name
    );
    
    if (spotifyId) {
      mappings.push({
        spotify_id: spotifyId,
        ticketmaster_id: artist.ticketmaster_id,
        artist_name: artist.name,
        confidence_score: 1.0 // Could be enhanced with fuzzy matching scores
      });
    }
    
    // Add small delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return mappings;
};

/**
 * Get unified artist ID (prefers Spotify ID)
 */
export const getUnifiedArtistId = async (
  ticketmasterId?: string,
  spotifyId?: string,
  artistName?: string
): Promise<string | null> => {
  // If we have a Spotify ID, use it
  if (spotifyId) {
    return spotifyId;
  }
  
  // If we have a Ticketmaster ID, try to map it
  if (ticketmasterId && artistName) {
    return await findSpotifyArtistForTicketmaster(ticketmasterId, artistName);
  }
  
  return null;
};
