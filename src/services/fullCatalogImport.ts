import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";
import { SpotifyArtist, SpotifyTrack, SpotifyAlbum } from "./spotify";

export interface ImportProgress {
  artist_id: string;
  stage: 'starting' | 'fetching_albums' | 'processing_albums' | 'storing_tracks' | 'completed' | 'failed';
  total_albums: number;
  processed_albums: number;
  total_tracks: number;
  imported_tracks: number;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface ImportResult {
  success: boolean;
  artist_id: string;
  tracks_imported: number;
  albums_processed: number;
  error?: string;
}

// Track import progress in the database
async function updateImportProgress(progress: Partial<ImportProgress>): Promise<void> {
  try {
    const { error } = await supabase
      .from('artist_import_progress')
      .upsert({
        ...progress,
        artist_id: progress.artist_id!
      }, {
        onConflict: 'artist_id'
      });

    if (error) {
      console.error('Error updating import progress:', error);
    }
  } catch (error) {
    console.error('Error updating import progress:', error);
  }
}

// Get current import progress for an artist
export async function getImportProgress(artistId: string): Promise<ImportProgress | null> {
  try {
    const { data, error } = await supabase
      .from('artist_import_progress')
      .select('*')
      .eq('artist_id', artistId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching import progress:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching import progress:', error);
    return null;
  }
}

// Check if an artist needs catalog import
export async function needsCatalogImport(artistId: string): Promise<boolean> {
  try {
    // Check if artist has songs
    const { count: songCount } = await supabase
      .from('songs')
      .select('id', { count: 'exact' })
      .eq('artist_id', artistId);

    // Check last sync date
    const { data: artist } = await supabase
      .from('artists')
      .select('last_synced_at')
      .eq('id', artistId)
      .single();

    if (!artist || songCount === 0) {
      return true;
    }

    // Check if last sync was more than 7 days ago
    if (artist.last_synced_at) {
      const lastSynced = new Date(artist.last_synced_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastSynced <= sevenDaysAgo;
    }

    return true;
  } catch (error) {
    console.error('Error checking catalog import status:', error);
    return true;
  }
}

// Enhanced full catalog import with comprehensive progress tracking
export async function importFullArtistCatalog(
  artistId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  console.log(`🎵 Starting enhanced full catalog import for artist: ${artistId}`);

  const startTime = new Date().toISOString();
  let currentProgress: ImportProgress = {
    artist_id: artistId,
    stage: 'starting',
    total_albums: 0,
    processed_albums: 0,
    total_tracks: 0,
    imported_tracks: 0,
    started_at: startTime
  };

  try {
    // Update progress: Starting
    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    // Stage 1: Fetch all albums
    currentProgress.stage = 'fetching_albums';
    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    const albums = await spotifyService.getArtistAlbums(artistId);
    console.log(`📀 Found ${albums.length} albums for artist ${artistId}`);

    if (albums.length === 0) {
      // Fall back to top tracks if no albums found
      console.log(`⚠️ No albums found, falling back to top tracks for artist ${artistId}`);
      const topTracks = await spotifyService.getArtistTopTracks(artistId);
      
      if (topTracks.length > 0) {
        const stored = await spotifyService.storeTracksInDatabase(artistId, topTracks);
        
        currentProgress = {
          ...currentProgress,
          stage: stored ? 'completed' : 'failed',
          total_tracks: topTracks.length,
          imported_tracks: stored ? topTracks.length : 0,
          completed_at: new Date().toISOString(),
          error_message: stored ? null : 'Failed to store top tracks'
        };

        await updateImportProgress(currentProgress);
        onProgress?.(currentProgress);

        return {
          success: stored,
          artist_id: artistId,
          tracks_imported: stored ? topTracks.length : 0,
          albums_processed: 0,
          error: stored ? undefined : 'Failed to store top tracks'
        };
      }

      currentProgress.stage = 'failed';
      currentProgress.error_message = 'No albums or top tracks found';
      await updateImportProgress(currentProgress);
      onProgress?.(currentProgress);

      return {
        success: false,
        artist_id: artistId,
        tracks_imported: 0,
        albums_processed: 0,
        error: 'No albums or top tracks found'
      };
    }

    // Stage 2: Process albums
    currentProgress.stage = 'processing_albums';
    currentProgress.total_albums = albums.length;
    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    let allTracks: SpotifyTrack[] = [];
    let albumsProcessed = 0;
    const maxAlbumsToProcess = Math.min(albums.length, 50); // Limit to prevent excessive API calls

    // Process albums in batches
    const batchSize = 3;
    for (let i = 0; i < maxAlbumsToProcess; i += batchSize) {
      const albumBatch = albums.slice(i, Math.min(i + batchSize, maxAlbumsToProcess));
      
      for (const album of albumBatch) {
        try {
          console.log(`🎶 Processing album: ${album.name} (${albumsProcessed + 1}/${maxAlbumsToProcess})`);
          
          const albumTracks = await spotifyService.getAlbumTracks(album.id);
          
          // Add album info to tracks
          const tracksWithAlbum = albumTracks.map(track => ({
            ...track,
            album: { name: album.name, images: album.images }
          }));
          
          allTracks.push(...tracksWithAlbum);
          albumsProcessed++;

          // Update progress
          currentProgress.processed_albums = albumsProcessed;
          currentProgress.total_tracks = allTracks.length;
          await updateImportProgress(currentProgress);
          onProgress?.(currentProgress);

          // Rate limiting between albums
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Error processing album ${album.name}:`, error);
          albumsProcessed++;
          
          // Update progress even on error
          currentProgress.processed_albums = albumsProcessed;
          await updateImportProgress(currentProgress);
          onProgress?.(currentProgress);
        }
      }
      
      // Longer delay between batches
      if (i + batchSize < maxAlbumsToProcess) {
        console.log(`⏳ Waiting between batches... (${i + batchSize}/${maxAlbumsToProcess})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Stage 3: Store tracks
    currentProgress.stage = 'storing_tracks';
    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    // Deduplicate tracks
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );

    console.log(`💾 Storing ${uniqueTracks.length} unique tracks for artist ${artistId}`);

    const tracksStored = await spotifyService.storeTracksInDatabase(artistId, uniqueTracks);

    // Stage 4: Complete
    currentProgress.stage = tracksStored ? 'completed' : 'failed';
    currentProgress.imported_tracks = tracksStored ? uniqueTracks.length : 0;
    currentProgress.completed_at = new Date().toISOString();
    currentProgress.error_message = tracksStored ? null : 'Failed to store tracks in database';

    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    // Update artist sync timestamp
    if (tracksStored) {
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artistId);
    }

    console.log(`✅ Catalog import ${tracksStored ? 'completed' : 'failed'} for artist ${artistId}`);
    console.log(`📊 Albums processed: ${albumsProcessed}, Tracks imported: ${uniqueTracks.length}`);

    return {
      success: tracksStored,
      artist_id: artistId,
      tracks_imported: tracksStored ? uniqueTracks.length : 0,
      albums_processed: albumsProcessed,
      error: tracksStored ? undefined : 'Failed to store tracks in database'
    };

  } catch (error) {
    console.error(`💥 Error in full catalog import for artist ${artistId}:`, error);
    
    currentProgress.stage = 'failed';
    currentProgress.error_message = error instanceof Error ? error.message : 'Unknown error';
    currentProgress.completed_at = new Date().toISOString();
    
    await updateImportProgress(currentProgress);
    onProgress?.(currentProgress);

    return {
      success: false,
      artist_id: artistId,
      tracks_imported: 0,
      albums_processed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Import user's Spotify top artists with full catalogs
export async function importUserTopArtistsWithCatalogs(
  userId: string,
  spotifyAccessToken: string,
  maxArtists: number = 10,
  onProgress?: (artistName: string, progress: ImportProgress) => void
): Promise<{success: boolean; imported: number; errors: string[]}> {
  console.log(`🎯 Starting import of user's top artists with full catalogs`);
  
  const errors: string[] = [];
  let importedCount = 0;

  try {
    // Get user's top artists from Spotify
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50', {
      headers: {
        'Authorization': `Bearer ${spotifyAccessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user's top artists: ${response.status}`);
    }

    const data = await response.json();
    const topArtists = data.items.slice(0, maxArtists) as SpotifyArtist[];

    console.log(`👤 Found ${topArtists.length} top artists for user`);

    for (let i = 0; i < topArtists.length; i++) {
      const artist = topArtists[i];
      
      try {
        console.log(`🎤 Processing artist ${i + 1}/${topArtists.length}: ${artist.name}`);
        
        // Store artist in database
        await spotifyService.storeArtistInDatabase(artist);
        
        // Check if user already follows this artist
        const { data: existingFollow } = await supabase
          .from('user_artists')
          .select('id')
          .eq('user_id', userId)
          .eq('artist_id', artist.id)
          .single();

        if (!existingFollow) {
          // Add to user's artists
          const { error: followError } = await supabase
            .from('user_artists')
            .insert({
              user_id: userId,
              artist_id: artist.id,
              rank: i + 1
            });

          if (followError) {
            console.error(`Error following artist ${artist.name}:`, followError);
            errors.push(`Failed to follow ${artist.name}`);
          }
        }

        // Import full catalog
        const result = await importFullArtistCatalog(
          artist.id,
          (progress) => onProgress?.(artist.name, progress)
        );

        if (result.success) {
          importedCount++;
          console.log(`✅ Successfully imported catalog for ${artist.name}: ${result.tracks_imported} tracks`);
        } else {
          errors.push(`Failed to import catalog for ${artist.name}: ${result.error}`);
        }

        // Rate limiting between artists
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing artist ${artist.name}:`, error);
        errors.push(`Error processing ${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`🎉 Completed import: ${importedCount}/${topArtists.length} artists successfully imported`);

    return {
      success: importedCount > 0,
      imported: importedCount,
      errors
    };

  } catch (error) {
    console.error('Error importing user top artists:', error);
    errors.push(`Failed to fetch user's top artists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      imported: 0,
      errors
    };
  }
}

// Batch import for multiple artists
export async function batchImportArtistCatalogs(
  artistIds: string[],
  onProgress?: (artistId: string, progress: ImportProgress) => void
): Promise<ImportResult[]> {
  console.log(`📚 Starting batch import for ${artistIds.length} artists`);
  
  const results: ImportResult[] = [];
  
  for (let i = 0; i < artistIds.length; i++) {
    const artistId = artistIds[i];
    console.log(`🎯 Processing artist ${i + 1}/${artistIds.length}: ${artistId}`);
    
    try {
      const result = await importFullArtistCatalog(
        artistId,
        (progress) => onProgress?.(artistId, progress)
      );
      
      results.push(result);
      
      // Rate limiting between artists
      if (i < artistIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`Error importing catalog for artist ${artistId}:`, error);
      results.push({
        success: false,
        artist_id: artistId,
        tracks_imported: 0,
        albums_processed: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`📊 Batch import completed: ${successful}/${artistIds.length} successful`);
  
  return results;
}