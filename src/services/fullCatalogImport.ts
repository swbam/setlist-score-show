import { supabase } from "@/integrations/supabase/client";
import { 
  getArtistTopTracks, 
  getArtistAlbums, 
  getAlbumTracks,
  SpotifyTrack,
  SpotifyAlbum 
} from "./spotify";

export interface CatalogImportProgress {
  artistId: string;
  artistName: string;
  totalAlbums: number;
  processedAlbums: number;
  totalTracks: number;
  importedTracks: number;
  skippedTracks: number;
  errors: string[];
  isComplete: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface CatalogImportResult {
  success: boolean;
  progress: CatalogImportProgress;
  error?: string;
}

// Helper function to extract Spotify ID from URL
function extractSpotifyId(spotifyUrl: string): string {
  const match = spotifyUrl.match(/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : '';
}

// Import full catalog for an artist
export async function importFullArtistCatalog(
  artistId: string,
  spotifyArtistId: string,
  onProgress?: (progress: CatalogImportProgress) => void
): Promise<CatalogImportResult> {
  const progress: CatalogImportProgress = {
    artistId,
    artistName: '',
    totalAlbums: 0,
    processedAlbums: 0,
    totalTracks: 0,
    importedTracks: 0,
    skippedTracks: 0,
    errors: [],
    isComplete: false,
    startTime: new Date()
  };

  try {
    // Get artist name
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('name')
      .eq('id', artistId)
      .single();

    if (artistError || !artistData) {
      return {
        success: false,
        progress,
        error: 'Artist not found'
      };
    }

    progress.artistName = artistData.name;
    onProgress?.(progress);

    // Get all albums for the artist
    const albums = await getArtistAlbums(spotifyArtistId);
    progress.totalAlbums = albums.length;
    onProgress?.(progress);

    // Process each album
    for (const album of albums) {
      try {
        await processAlbum(artistId, album, progress, onProgress);
        progress.processedAlbums++;
        onProgress?.(progress);

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing album ${album.name}:`, error);
        progress.errors.push(`Failed to process album: ${album.name}`);
        onProgress?.(progress);
      }
    }

    progress.isComplete = true;
    progress.endTime = new Date();
    onProgress?.(progress);

    return {
      success: true,
      progress
    };

  } catch (error) {
    console.error('Error importing catalog:', error);
    progress.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    progress.isComplete = true;
    progress.endTime = new Date();
    onProgress?.(progress);

    return {
      success: false,
      progress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process a single album
async function processAlbum(
  artistId: string,
  album: SpotifyAlbum,
  progress: CatalogImportProgress,
  onProgress?: (progress: CatalogImportProgress) => void
): Promise<void> {
  try {
    // Get tracks for this album
    const tracks = await getAlbumTracks(album.id);
    progress.totalTracks += tracks.length;
    onProgress?.(progress);

    // Import each track
    for (const track of tracks) {
      try {
        const imported = await importTrack(artistId, track, album);
        if (imported) {
          progress.importedTracks++;
        } else {
          progress.skippedTracks++;
        }
        onProgress?.(progress);
      } catch (error) {
        console.error(`Error importing track ${track.name}:`, error);
        progress.errors.push(`Failed to import track: ${track.name}`);
        progress.skippedTracks++;
        onProgress?.(progress);
      }
    }
  } catch (error) {
    console.error(`Error getting tracks for album ${album.name}:`, error);
    progress.errors.push(`Failed to get tracks for album: ${album.name}`);
    onProgress?.(progress);
  }
}

// Import a single track
async function importTrack(
  artistId: string,
  track: SpotifyTrack,
  album: SpotifyAlbum
): Promise<boolean> {
  try {
    // Check if track already exists
    const { data: existingTrack } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .eq('spotify_url', track.external_urls?.spotify || '')
      .single();

    if (existingTrack) {
      return false; // Already exists, skip
    }

    // Insert the track
    const { error } = await supabase
      .from('songs')
      .insert({
        id: crypto.randomUUID(),
        artist_id: artistId,
        name: track.name,
        spotify_url: track.external_urls?.spotify || '',
        duration_ms: track.duration_ms,
        popularity: track.popularity || 0,
        album: album.name
      });

    if (error) {
      console.error('Error inserting track:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error importing track:', error);
    return false;
  }
}

// Get catalog import status for an artist
export async function getCatalogImportStatus(artistId: string): Promise<{
  hasFullCatalog: boolean;
  songCount: number;
  lastImport?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId);

    if (error) {
      console.error('Error getting catalog status:', error);
      return { hasFullCatalog: false, songCount: 0 };
    }

    const songCount = data?.length || 0;
    const hasFullCatalog = songCount > 20; // Assume full catalog if more than 20 songs

    return {
      hasFullCatalog,
      songCount
    };
  } catch (error) {
    console.error('Error getting catalog status:', error);
    return { hasFullCatalog: false, songCount: 0 };
  }
}

// Update artist catalog (refresh with new songs)
export async function updateArtistCatalog(
  artistId: string,
  spotifyArtistId: string,
  onProgress?: (progress: CatalogImportProgress) => void
): Promise<CatalogImportResult> {
  // For updates, we'll import the full catalog again
  // The importTrack function will skip existing tracks
  return importFullArtistCatalog(artistId, spotifyArtistId, onProgress);
}

// Batch import catalogs for multiple artists
export async function batchImportCatalogs(
  artists: Array<{ id: string; spotifyId: string; name: string }>,
  onProgress?: (artistIndex: number, progress: CatalogImportProgress) => void
): Promise<CatalogImportResult[]> {
  const results: CatalogImportResult[] = [];

  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    console.log(`Importing catalog for ${artist.name} (${i + 1}/${artists.length})`);

    const result = await importFullArtistCatalog(
      artist.id,
      artist.spotifyId,
      (progress) => onProgress?.(i, progress)
    );

    results.push(result);

    // Add delay between artists to respect rate limits
    if (i < artists.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

// Get artists that need catalog imports
export async function getArtistsNeedingCatalogImport(): Promise<Array<{
  id: string;
  name: string;
  spotifyId: string;
  songCount: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        spotify_url,
        songs(id)
      `)
      .not('spotify_url', 'is', null);

    if (error) {
      console.error('Error getting artists needing import:', error);
      return [];
    }

    return (data || [])
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        spotifyId: extractSpotifyId(artist.spotify_url!),
        songCount: artist.songs?.length || 0
      }))
      .filter(artist => artist.songCount < 20) // Need more songs
      .sort((a, b) => a.songCount - b.songCount); // Prioritize artists with fewer songs

  } catch (error) {
    console.error('Error getting artists needing import:', error);
    return [];
  }
}