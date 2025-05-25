
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";

/**
 * Enhanced service to handle mapping between Ticketmaster and Spotify artist IDs
 * This addresses the critical issue of different ID systems between APIs
 */

export interface ArtistMapping {
  spotify_id: string;
  ticketmaster_id: string;
  artist_name: string;
  confidence_score: number;
  verified: boolean;
}

/**
 * Create or update artist mapping between Ticketmaster and Spotify
 */
export const createArtistMapping = async (
  ticketmasterId: string,
  spotifyId: string,
  artistName: string,
  confidence: number = 1.0
): Promise<boolean> => {
  try {
    // Store mapping in the artists table with both IDs
    const { error } = await supabase
      .from('artists')
      .upsert({
        id: spotifyId, // Use Spotify ID as primary key
        ticketmaster_id: ticketmasterId,
        name: artistName,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating artist mapping:', error);
      return false;
    }

    console.log(`Created mapping: TM ${ticketmasterId} <-> Spotify ${spotifyId}`);
    return true;
  } catch (error) {
    console.error('Error creating artist mapping:', error);
    return false;
  }
};

/**
 * Find Spotify artist for a Ticketmaster artist with improved matching
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
      console.log(`Found existing mapping for TM ${ticketmasterArtistId} -> Spotify ${existingArtist.id}`);
      return existingArtist.id;
    }
    
    // Search for the artist on Spotify with improved matching
    const spotifyResults = await spotifyService.searchArtists(artistName);
    
    if (spotifyResults.length > 0) {
      // Implement smart matching algorithm
      const bestMatch = findBestSpotifyMatch(spotifyResults, artistName);
      
      if (bestMatch) {
        // Store this mapping for future use
        const success = await createArtistMapping(
          ticketmasterArtistId,
          bestMatch.id,
          bestMatch.name,
          calculateMatchConfidence(bestMatch.name, artistName)
        );
        
        if (success) {
          // Also store the full Spotify artist data
          await spotifyService.storeArtistInDatabase(bestMatch);
          return bestMatch.id;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding Spotify artist for Ticketmaster:', error);
    return null;
  }
};

/**
 * Find the best matching Spotify artist using multiple criteria
 */
const findBestSpotifyMatch = (spotifyResults: any[], targetName: string): any | null => {
  if (spotifyResults.length === 0) return null;
  
  // Exact match (case-insensitive)
  const exactMatch = spotifyResults.find(artist => 
    artist.name.toLowerCase() === targetName.toLowerCase()
  );
  
  if (exactMatch) {
    console.log(`Found exact match for "${targetName}"`);
    return exactMatch;
  }
  
  // Partial match with highest popularity
  const partialMatches = spotifyResults.filter(artist =>
    artist.name.toLowerCase().includes(targetName.toLowerCase()) ||
    targetName.toLowerCase().includes(artist.name.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    const bestPartialMatch = partialMatches.reduce((best, current) =>
      (current.popularity || 0) > (best.popularity || 0) ? current : best
    );
    console.log(`Found partial match for "${targetName}": "${bestPartialMatch.name}"`);
    return bestPartialMatch;
  }
  
  // Fallback to most popular result
  const mostPopular = spotifyResults.reduce((best, current) =>
    (current.popularity || 0) > (best.popularity || 0) ? current : best
  );
  
  console.log(`Using most popular result for "${targetName}": "${mostPopular.name}"`);
  return mostPopular;
};

/**
 * Calculate confidence score for artist name matching
 */
const calculateMatchConfidence = (spotifyName: string, targetName: string): number => {
  const spotify = spotifyName.toLowerCase();
  const target = targetName.toLowerCase();
  
  if (spotify === target) return 1.0;
  if (spotify.includes(target) || target.includes(spotify)) return 0.8;
  
  // Simple Levenshtein distance-based confidence
  const distance = levenshteinDistance(spotify, target);
  const maxLength = Math.max(spotify.length, target.length);
  return Math.max(0, 1 - distance / maxLength);
};

/**
 * Simple Levenshtein distance implementation
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Get unified artist ID with improved fallback logic
 */
export const getUnifiedArtistId = async (
  ticketmasterId?: string,
  spotifyId?: string,
  artistName?: string
): Promise<string | null> => {
  // If we have a Spotify ID, use it (preferred)
  if (spotifyId) {
    return spotifyId;
  }
  
  // If we have a Ticketmaster ID, try to map it to Spotify
  if (ticketmasterId && artistName) {
    const mappedSpotifyId = await findSpotifyArtistForTicketmaster(ticketmasterId, artistName);
    if (mappedSpotifyId) {
      return mappedSpotifyId;
    }
    
    // Fallback: create a basic artist entry with Ticketmaster ID as primary key
    const success = await createBasicArtistEntry(ticketmasterId, artistName);
    if (success) {
      return ticketmasterId;
    }
  }
  
  return null;
};

/**
 * Create a basic artist entry when Spotify mapping fails
 */
const createBasicArtistEntry = async (
  ticketmasterId: string,
  artistName: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('artists')
      .upsert({
        id: ticketmasterId,
        ticketmaster_id: ticketmasterId,
        name: artistName,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating basic artist entry:', error);
      return false;
    }

    console.log(`Created basic artist entry for TM ${ticketmasterId}: ${artistName}`);
    return true;
  } catch (error) {
    console.error('Error creating basic artist entry:', error);
    return false;
  }
};

/**
 * Batch process artist mappings with rate limiting
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
        confidence_score: 1.0,
        verified: false
      });
    }
    
    // Rate limiting: 100ms delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return mappings;
};
