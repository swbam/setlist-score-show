// services/artist-mapping.ts
import { supabase } from '@/integrations/supabase/client';
import { searchSpotifyArtists } from './spotify';

// Simple string similarity function
function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

export async function mapTicketmasterToSpotify(tmArtistName: string) {
  // Search Spotify for artist
  const spotifyResults = await searchSpotifyArtists(tmArtistName);

  if (spotifyResults.length === 0) return null;

  // Use fuzzy matching to find best match
  const bestMatch = spotifyResults.reduce((best, current) => {
    const currentSimilarity = similarity(tmArtistName, current.name);
    const bestSimilarity = similarity(tmArtistName, best.name);
    return currentSimilarity > bestSimilarity ? current : best;
  });

  // Store mapping in artists table
  await supabase
    .from('artists')
    .upsert({
      id: bestMatch.id,
      name: bestMatch.name,
      image_url: bestMatch.images[0]?.url,
      popularity: bestMatch.popularity,
      genres: bestMatch.genres,
      spotify_url: bestMatch.external_urls.spotify,
      ticketmaster_name: tmArtistName // Add this column
    });

  return bestMatch.id;
}
