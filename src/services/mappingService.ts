
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";

/**
 * Service to handle mapping between different API artist IDs
 * Critical for connecting Ticketmaster and Spotify data
 */

export interface ArtistMapping {
  spotify_id: string;
  ticketmaster_id: string;
  artist_name: string;
  confidence_score: number;
}

/**
 * Find or create unified artist mapping
 */
export async function getUnifiedArtistId(
  ticketmasterArtistId?: string,
  artistName?: string
): Promise<string | null> {
  try {
    // Check if we already have this mapping
    if (ticketmasterArtistId) {
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id')
        .eq('ticketmaster_id', ticketmasterArtistId)
        .maybeSingle();
      
      if (existingArtist) {
        return existingArtist.id;
      }
    }
    
    // Search for artist on Spotify
    if (artistName) {
      const spotifyResults = await spotifyService.searchArtists(artistName);
      
      if (spotifyResults.length > 0) {
        const bestMatch = findBestSpotifyMatch(spotifyResults, artistName);
        
        if (bestMatch) {
          // Store this mapping
          await createArtistMapping(ticketmasterArtistId, bestMatch.id, bestMatch.name);
          return bestMatch.id;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting unified artist ID:', error);
    return null;
  }
}

/**
 * Create artist mapping in database
 */
async function createArtistMapping(
  ticketmasterId?: string,
  spotifyId?: string,
  artistName?: string
): Promise<boolean> {
  try {
    if (!spotifyId || !artistName) return false;
    
    const { error } = await supabase
      .from('artists')
      .upsert({
        id: spotifyId,
        ticketmaster_id: ticketmasterId,
        name: artistName,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating artist mapping:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating artist mapping:', error);
    return false;
  }
}

/**
 * Find best matching Spotify artist
 */
function findBestSpotifyMatch(spotifyResults: any[], targetName: string): any | null {
  if (spotifyResults.length === 0) return null;
  
  // Exact match first
  const exactMatch = spotifyResults.find(artist => 
    artist.name.toLowerCase() === targetName.toLowerCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Partial match with highest popularity
  const partialMatches = spotifyResults.filter(artist =>
    artist.name.toLowerCase().includes(targetName.toLowerCase()) ||
    targetName.toLowerCase().includes(artist.name.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    return partialMatches.reduce((best, current) =>
      (current.popularity || 0) > (best.popularity || 0) ? current : best
    );
  }
  
  // Fallback to most popular
  return spotifyResults.reduce((best, current) =>
    (current.popularity || 0) > (best.popularity || 0) ? current : best
  );
}

/**
 * Batch process multiple artist mappings
 */
export async function batchMapArtists(
  artists: Array<{ ticketmaster_id: string; name: string }>
): Promise<ArtistMapping[]> {
  const mappings: ArtistMapping[] = [];
  
  for (const artist of artists) {
    const spotifyId = await getUnifiedArtistId(artist.ticketmaster_id, artist.name);
    
    if (spotifyId) {
      mappings.push({
        spotify_id: spotifyId,
        ticketmaster_id: artist.ticketmaster_id,
        artist_name: artist.name,
        confidence_score: 1.0
      });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return mappings;
}
