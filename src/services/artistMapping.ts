import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";
import * as ticketmasterService from "./ticketmaster";

// Types for artist mapping
export interface ArtistMapping {
  spotify_id?: string;
  ticketmaster_id?: string;
  artist_name: string;
  confidence: number; // 0-1 confidence score for the match
}

export interface MappingResult {
  success: boolean;
  spotify_id?: string;
  ticketmaster_id?: string;
  confidence?: number;
  error?: string;
}

/**
 * Find Spotify artist ID for a Ticketmaster artist
 */
export async function findSpotifyIdForTicketmasterArtist(
  ticketmasterArtistId: string,
  artistName: string
): Promise<MappingResult> {
  try {
    console.log(`Finding Spotify ID for Ticketmaster artist: ${artistName} (${ticketmasterArtistId})`);
    
    // First check if we already have this mapping in our artists table
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('id')
      .or(`id.eq.${ticketmasterArtistId},name.ilike.${artistName}`)
      .maybeSingle();
      
    if (existingArtist) {
      console.log(`Found existing artist mapping: ${existingArtist.id}`);
      return {
        success: true,
        spotify_id: existingArtist.id,
        ticketmaster_id: ticketmasterArtistId,
        confidence: 1.0
      };
    }
    
    // Search Spotify for the artist
    const spotifyArtists = await spotifyService.searchArtists(artistName);
    
    if (!spotifyArtists || spotifyArtists.length === 0) {
      console.log(`No Spotify artists found for: ${artistName}`);
      return {
        success: false,
        error: "No matching Spotify artist found"
      };
    }
    
    // Find the best match
    const bestMatch = findBestMatch(artistName, spotifyArtists);
    
    if (bestMatch) {
      console.log(`Found Spotify match: ${bestMatch.artist.name} (${bestMatch.artist.id}) with confidence ${bestMatch.confidence}`);
      
      // Store the artist in our database
      await spotifyService.storeArtistInDatabase(bestMatch.artist);
      
      return {
        success: true,
        spotify_id: bestMatch.artist.id,
        ticketmaster_id: ticketmasterArtistId,
        confidence: bestMatch.confidence
      };
    }
    
    return {
      success: false,
      error: "No confident match found"
    };
  } catch (error) {
    console.error("Error finding Spotify ID:", error);
    return {
      success: false,
      error: "An error occurred during mapping"
    };
  }
}

/**
 * Find Ticketmaster artist ID for a Spotify artist
 */
export async function findTicketmasterIdForSpotifyArtist(
  spotifyArtistId: string,
  artistName: string
): Promise<MappingResult> {
  try {
    console.log(`Finding Ticketmaster ID for Spotify artist: ${artistName} (${spotifyArtistId})`);
    
    // Search Ticketmaster for events by this artist
    const events = await ticketmasterService.searchEvents(artistName);
    
    if (!events || events.length === 0) {
      console.log(`No Ticketmaster events found for: ${artistName}`);
      return {
        success: false,
        error: "No Ticketmaster events found for this artist"
      };
    }
    
    // Extract unique artist IDs from events
    const ticketmasterArtists = new Map<string, {id: string, name: string}>();
    
    for (const event of events) {
      if (event._embedded?.attractions) {
        for (const attraction of event._embedded.attractions) {
          if (attraction.id && attraction.name) {
            ticketmasterArtists.set(attraction.id, {
              id: attraction.id,
              name: attraction.name
            });
          }
        }
      }
    }
    
    if (ticketmasterArtists.size === 0) {
      return {
        success: false,
        error: "No artist information found in Ticketmaster events"
      };
    }
    
    // Find the best match
    const artistsArray = Array.from(ticketmasterArtists.values());
    const bestMatch = findBestMatchFromTicketmaster(artistName, artistsArray);
    
    if (bestMatch) {
      console.log(`Found Ticketmaster match: ${bestMatch.artist.name} (${bestMatch.artist.id}) with confidence ${bestMatch.confidence}`);
      
      return {
        success: true,
        spotify_id: spotifyArtistId,
        ticketmaster_id: bestMatch.artist.id,
        confidence: bestMatch.confidence
      };
    }
    
    return {
      success: false,
      error: "No confident match found"
    };
  } catch (error) {
    console.error("Error finding Ticketmaster ID:", error);
    return {
      success: false,
      error: "An error occurred during mapping"
    };
  }
}

/**
 * Get or create artist mapping
 */
export async function getOrCreateArtistMapping(
  artistName: string,
  spotifyId?: string,
  ticketmasterId?: string
): Promise<ArtistMapping | null> {
  try {
    // If we have both IDs, we're good
    if (spotifyId && ticketmasterId) {
      return {
        spotify_id: spotifyId,
        ticketmaster_id: ticketmasterId,
        artist_name: artistName,
        confidence: 1.0
      };
    }
    
    // If we have Spotify ID, find Ticketmaster ID
    if (spotifyId && !ticketmasterId) {
      const result = await findTicketmasterIdForSpotifyArtist(spotifyId, artistName);
      if (result.success && result.ticketmaster_id) {
        return {
          spotify_id: spotifyId,
          ticketmaster_id: result.ticketmaster_id,
          artist_name: artistName,
          confidence: result.confidence || 0.8
        };
      }
    }
    
    // If we have Ticketmaster ID, find Spotify ID
    if (ticketmasterId && !spotifyId) {
      const result = await findSpotifyIdForTicketmasterArtist(ticketmasterId, artistName);
      if (result.success && result.spotify_id) {
        return {
          spotify_id: result.spotify_id,
          ticketmaster_id: ticketmasterId,
          artist_name: artistName,
          confidence: result.confidence || 0.8
        };
      }
    }
    
    // If we have neither, try to find both
    if (!spotifyId && !ticketmasterId) {
      // First search Spotify
      const spotifyArtists = await spotifyService.searchArtists(artistName);
      if (spotifyArtists && spotifyArtists.length > 0) {
        const bestSpotify = findBestMatch(artistName, spotifyArtists);
        if (bestSpotify && bestSpotify.confidence > 0.7) {
          // Now find Ticketmaster ID
          const ticketmasterResult = await findTicketmasterIdForSpotifyArtist(
            bestSpotify.artist.id,
            bestSpotify.artist.name
          );
          
          if (ticketmasterResult.success && ticketmasterResult.ticketmaster_id) {
            return {
              spotify_id: bestSpotify.artist.id,
              ticketmaster_id: ticketmasterResult.ticketmaster_id,
              artist_name: bestSpotify.artist.name,
              confidence: Math.min(bestSpotify.confidence, ticketmasterResult.confidence || 0.8)
            };
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting/creating artist mapping:", error);
    return null;
  }
}

/**
 * Find the best matching Spotify artist based on name similarity
 */
function findBestMatch(
  targetName: string,
  spotifyArtists: spotifyService.SpotifyArtist[]
): { artist: spotifyService.SpotifyArtist; confidence: number } | null {
  if (spotifyArtists.length === 0) return null;
  
  const normalized = normalizeArtistName(targetName);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const artist of spotifyArtists) {
    const score = calculateSimilarity(normalized, normalizeArtistName(artist.name));
    
    // Boost score for high popularity artists
    const popularityBoost = artist.popularity ? artist.popularity / 200 : 0; // Max 0.5 boost
    const finalScore = score + (score * popularityBoost);
    
    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMatch = { artist, confidence: Math.min(finalScore, 1.0) };
    }
  }
  
  // Only return matches with reasonable confidence
  return bestMatch && bestMatch.confidence > 0.7 ? bestMatch : null;
}

/**
 * Find the best matching Ticketmaster artist
 */
function findBestMatchFromTicketmaster(
  targetName: string,
  ticketmasterArtists: Array<{id: string, name: string}>
): { artist: {id: string, name: string}; confidence: number } | null {
  if (ticketmasterArtists.length === 0) return null;
  
  const normalized = normalizeArtistName(targetName);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const artist of ticketmasterArtists) {
    const score = calculateSimilarity(normalized, normalizeArtistName(artist.name));
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { artist, confidence: score };
    }
  }
  
  // Only return matches with reasonable confidence
  return bestMatch && bestMatch.confidence > 0.7 ? bestMatch : null;
}

/**
 * Normalize artist name for comparison
 */
function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) return 1.0;
  
  // One string contains the other
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
} 