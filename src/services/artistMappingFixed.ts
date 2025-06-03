
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";

/**
 * Fixed artist mapping service to resolve Ticketmaster <-> Spotify ID issues
 */

export interface ArtistMappingResult {
  success: boolean;
  artistId: string | null;
  source: 'existing' | 'mapped' | 'created';
  error?: string;
}

/**
 * Get or create unified artist ID with improved error handling
 */
export async function getUnifiedArtistId(
  ticketmasterArtistName: string,
  ticketmasterId?: string
): Promise<ArtistMappingResult> {
  try {
    console.log(`[Artist Mapping] Starting for: ${ticketmasterArtistName}`);

    // Step 1: Check if we already have this artist by Ticketmaster name
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('id, name')
      .or(`ticketmaster_name.eq.${ticketmasterArtistName},name.eq.${ticketmasterArtistName}`)
      .maybeSingle();
    
    if (existingArtist) {
      console.log(`[Artist Mapping] Found existing artist: ${existingArtist.id}`);
      return {
        success: true,
        artistId: existingArtist.id,
        source: 'existing'
      };
    }

    // Step 2: Search Spotify for this artist
    console.log(`[Artist Mapping] Searching Spotify for: ${ticketmasterArtistName}`);
    const spotifyResults = await spotifyService.searchArtists(ticketmasterArtistName);
    
    if (spotifyResults.length === 0) {
      console.warn(`[Artist Mapping] No Spotify results for: ${ticketmasterArtistName}`);
      return {
        success: false,
        artistId: null,
        source: 'created',
        error: 'No Spotify artist found'
      };
    }

    // Step 3: Find best match
    const bestMatch = findBestSpotifyMatch(spotifyResults, ticketmasterArtistName);
    
    if (!bestMatch) {
      console.warn(`[Artist Mapping] No suitable match found for: ${ticketmasterArtistName}`);
      return {
        success: false,
        artistId: null,
        source: 'created',
        error: 'No suitable Spotify match'
      };
    }

    // Step 4: Store the artist with mapping
    console.log(`[Artist Mapping] Storing artist: ${bestMatch.name} (${bestMatch.id})`);
    
    const artistData = {
      id: bestMatch.id, // Use Spotify ID as primary key
      name: bestMatch.name,
      image_url: bestMatch.images?.[0]?.url || null,
      popularity: bestMatch.popularity || 0,
      genres: bestMatch.genres || [],
      spotify_url: bestMatch.external_urls?.spotify || '',
      ticketmaster_name: ticketmasterArtistName, // Store original TM name for mapping
      ticketmaster_id: ticketmasterId || null,
      last_synced_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('artists')
      .upsert(artistData);

    if (insertError) {
      console.error(`[Artist Mapping] Error storing artist:`, insertError);
      return {
        success: false,
        artistId: null,
        source: 'created',
        error: insertError.message
      };
    }

    console.log(`[Artist Mapping] Successfully mapped: ${ticketmasterArtistName} -> ${bestMatch.id}`);
    
    return {
      success: true,
      artistId: bestMatch.id,
      source: 'mapped'
    };

  } catch (error) {
    console.error(`[Artist Mapping] Error:`, error);
    return {
      success: false,
      artistId: null,
      source: 'created',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find best matching Spotify artist using improved algorithm
 */
function findBestSpotifyMatch(spotifyResults: any[], targetName: string): any | null {
  if (spotifyResults.length === 0) return null;
  
  const target = targetName.toLowerCase().trim();
  
  // 1. Exact match (case-insensitive)
  let exactMatch = spotifyResults.find(artist => 
    artist.name.toLowerCase().trim() === target
  );
  
  if (exactMatch) {
    console.log(`[Artist Mapping] Exact match found: ${exactMatch.name}`);
    return exactMatch;
  }

  // 2. Remove common prefixes/suffixes and try again
  const cleanTarget = cleanArtistName(target);
  exactMatch = spotifyResults.find(artist => 
    cleanArtistName(artist.name.toLowerCase()) === cleanTarget
  );
  
  if (exactMatch) {
    console.log(`[Artist Mapping] Clean exact match found: ${exactMatch.name}`);
    return exactMatch;
  }

  // 3. Contains match with highest popularity
  const containsMatches = spotifyResults.filter(artist => {
    const artistName = artist.name.toLowerCase();
    return artistName.includes(target) || target.includes(artistName);
  });
  
  if (containsMatches.length > 0) {
    const bestContains = containsMatches.reduce((best, current) =>
      (current.popularity || 0) > (best.popularity || 0) ? current : best
    );
    console.log(`[Artist Mapping] Contains match found: ${bestContains.name} (popularity: ${bestContains.popularity})`);
    return bestContains;
  }

  // 4. Fallback to most popular result
  const mostPopular = spotifyResults.reduce((best, current) =>
    (current.popularity || 0) > (best.popularity || 0) ? current : best
  );
  
  console.log(`[Artist Mapping] Fallback to most popular: ${mostPopular.name} (popularity: ${mostPopular.popularity})`);
  return mostPopular;
}

/**
 * Clean artist name by removing common prefixes and suffixes
 */
function cleanArtistName(name: string): string {
  return name
    .replace(/^(the\s+)/i, '') // Remove "the " prefix
    .replace(/\s+(band|group)$/i, '') // Remove " band" or " group" suffix
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim();
}

/**
 * Batch process multiple artist mappings for shows import
 */
export async function batchMapArtists(
  artists: Array<{ name: string; ticketmaster_id?: string }>
): Promise<Array<{ name: string; artistId: string | null; success: boolean }>> {
  const results = [];
  
  console.log(`[Artist Mapping] Batch processing ${artists.length} artists`);
  
  for (const artist of artists) {
    const result = await getUnifiedArtistId(artist.name, artist.ticketmaster_id);
    
    results.push({
      name: artist.name,
      artistId: result.artistId,
      success: result.success
    });
    
    // Rate limiting between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`[Artist Mapping] Batch complete: ${results.filter(r => r.success).length}/${results.length} successful`);
  
  return results;
}
