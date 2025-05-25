
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";

export interface ImportProgress {
  artistId: string;
  artistName: string;
  totalAlbums: number;
  processedAlbums: number;
  totalTracks: number;
  importedTracks: number;
  status: 'starting' | 'fetching_albums' | 'processing_albums' | 'importing_tracks' | 'completed' | 'error';
  error?: string;
}

export interface ImportResult {
  success: boolean;
  artistId: string;
  totalTracksImported: number;
  error?: string;
}

/**
 * Import full catalog for an artist with progress tracking
 */
export async function importFullArtistCatalog(
  artistId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  let progress: ImportProgress = {
    artistId,
    artistName: '',
    totalAlbums: 0,
    processedAlbums: 0,
    totalTracks: 0,
    importedTracks: 0,
    status: 'starting'
  };

  try {
    // Get artist details first
    const artist = await spotifyService.getArtist(artistId);
    if (!artist) {
      throw new Error('Artist not found');
    }
    
    progress.artistName = artist.name;
    progress.status = 'fetching_albums';
    onProgress?.(progress);

    // Store/update artist in database
    await spotifyService.storeArtistInDatabase(artist);

    // Get all albums for the artist
    console.log(`Fetching all albums for artist: ${artist.name}`);
    const albums = await spotifyService.getArtistAlbums(artistId);
    
    progress.totalAlbums = albums.length;
    progress.status = 'processing_albums';
    onProgress?.(progress);

    if (albums.length === 0) {
      console.log(`No albums found for artist: ${artist.name}, falling back to top tracks`);
      const topTracks = await spotifyService.getArtistTopTracks(artistId);
      const success = await spotifyService.storeTracksInDatabase(artistId, topTracks);
      
      return {
        success,
        artistId,
        totalTracksImported: topTracks.length,
        error: success ? undefined : 'Failed to import top tracks'
      };
    }

    // Process albums in batches to avoid overwhelming the API
    const batchSize = 3; // Process 3 albums at a time
    const allTracks: spotifyService.SpotifyTrack[] = [];
    
    for (let i = 0; i < albums.length; i += batchSize) {
      const albumBatch = albums.slice(i, i + batchSize);
      
      // Fetch tracks for each album in the batch
      const batchPromises = albumBatch.map(async (album) => {
        try {
          const tracks = await spotifyService.getAlbumTracks(album.id);
          console.log(`Fetched ${tracks.length} tracks from album: ${album.name}`);
          return tracks;
        } catch (error) {
          console.error(`Error fetching tracks for album ${album.name}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Flatten and add to all tracks
      for (const tracks of batchResults) {
        allTracks.push(...tracks);
      }

      progress.processedAlbums = Math.min(i + batchSize, albums.length);
      progress.totalTracks = allTracks.length;
      onProgress?.(progress);

      // Rate limiting: wait between batches
      if (i + batchSize < albums.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Remove duplicates by track ID
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );

    console.log(`Found ${uniqueTracks.length} unique tracks for artist: ${artist.name}`);
    
    progress.status = 'importing_tracks';
    progress.totalTracks = uniqueTracks.length;
    onProgress?.(progress);

    // Import tracks in batches
    const trackBatchSize = 50;
    let importedCount = 0;

    for (let i = 0; i < uniqueTracks.length; i += trackBatchSize) {
      const trackBatch = uniqueTracks.slice(i, i + trackBatchSize);
      
      const success = await spotifyService.storeTracksInDatabase(artistId, trackBatch);
      if (success) {
        importedCount += trackBatch.length;
      }
      
      progress.importedTracks = importedCount;
      onProgress?.(progress);

      // Rate limiting between track imports
      if (i + trackBatchSize < uniqueTracks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update artist's last synced timestamp
    await supabase
      .from('artists')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', artistId);

    progress.status = 'completed';
    onProgress?.(progress);

    console.log(`Successfully imported ${importedCount} tracks for artist: ${artist.name}`);

    return {
      success: true,
      artistId,
      totalTracksImported: importedCount
    };

  } catch (error) {
    console.error(`Error importing catalog for artist ${artistId}:`, error);
    
    progress.status = 'error';
    progress.error = error instanceof Error ? error.message : 'Unknown error';
    onProgress?.(progress);

    return {
      success: false,
      artistId,
      totalTracksImported: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Import catalogs for multiple artists with overall progress tracking
 */
export async function importMultipleArtistCatalogs(
  artistIds: string[],
  onOverallProgress?: (completed: number, total: number) => void,
  onArtistProgress?: (progress: ImportProgress) => void
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  
  for (let i = 0; i < artistIds.length; i++) {
    const artistId = artistIds[i];
    
    onOverallProgress?.(i, artistIds.length);
    
    const result = await importFullArtistCatalog(artistId, onArtistProgress);
    results.push(result);
    
    // Rate limiting between artists
    if (i < artistIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  onOverallProgress?.(artistIds.length, artistIds.length);
  return results;
}

/**
 * Get import statistics for an artist
 */
export async function getArtistImportStats(artistId: string): Promise<{
  totalSongs: number;
  lastImported: string | null;
  needsUpdate: boolean;
}> {
  try {
    // Get song count
    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    // Get last sync date
    const { data: artist } = await supabase
      .from('artists')
      .select('last_synced_at')
      .eq('id', artistId)
      .single();

    const lastImported = artist?.last_synced_at || null;
    
    // Check if needs update (older than 30 days or no songs)
    const needsUpdate = !lastImported || 
      new Date(lastImported) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ||
      (count || 0) === 0;

    return {
      totalSongs: count || 0,
      lastImported,
      needsUpdate
    };
  } catch (error) {
    console.error('Error getting import stats:', error);
    return {
      totalSongs: 0,
      lastImported: null,
      needsUpdate: true
    };
  }
}
