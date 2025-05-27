
import { supabase } from '@/integrations/supabase/client';
import * as spotifyService from './spotify';

export interface ImportProgress {
  status: 'idle' | 'importing' | 'completed' | 'error';
  progress: number;
  message: string;
  totalSongs?: number;
  importedSongs?: number;
}

export interface CatalogImportResult {
  success: boolean;
  songsImported: number;
  totalSongs: number;
  message: string;
}

export class CatalogImportManager {
  private onProgress?: (progress: ImportProgress) => void;

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(progress: ImportProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  async importArtistCatalog(artistId: string): Promise<CatalogImportResult> {
    try {
      this.updateProgress({
        status: 'importing',
        progress: 0,
        message: 'Starting catalog import...'
      });

      // Check if artist already has songs
      const { count: existingSongs } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);

      if (existingSongs && existingSongs > 20) {
        this.updateProgress({
          status: 'completed',
          progress: 100,
          message: 'Catalog already imported',
          totalSongs: existingSongs,
          importedSongs: 0
        });

        return {
          success: true,
          songsImported: 0,
          totalSongs: existingSongs,
          message: 'Catalog already exists'
        };
      }

      this.updateProgress({
        status: 'importing',
        progress: 20,
        message: 'Fetching artist albums...'
      });

      // Get all albums for the artist
      const albums = await spotifyService.getArtistAlbums(artistId);
      
      this.updateProgress({
        status: 'importing',
        progress: 40,
        message: `Found ${albums.length} albums. Fetching tracks...`
      });

      let allTracks: any[] = [];
      const batchSize = 5; // Process 5 albums at a time

      for (let i = 0; i < albums.length; i += batchSize) {
        const albumBatch = albums.slice(i, i + batchSize);
        
        const batchPromises = albumBatch.map(album =>
          spotifyService.getAlbumTracks(album.id).then(tracks =>
            tracks.map(track => ({
              id: track.id,
              artist_id: artistId,
              name: track.name,
              album: album.name,
              duration_ms: track.duration_ms,
              popularity: track.popularity || 50,
              spotify_url: track.external_urls?.spotify || ''
            }))
          )
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            allTracks.push(...result.value);
          }
        });

        const progress = Math.min(40 + ((i + batchSize) / albums.length) * 40, 80);
        this.updateProgress({
          status: 'importing',
          progress,
          message: `Processed ${Math.min(i + batchSize, albums.length)}/${albums.length} albums...`
        });
      }

      // Remove duplicates based on track name and normalize
      const uniqueTracks = this.deduplicateTracks(allTracks);

      this.updateProgress({
        status: 'importing',
        progress: 85,
        message: `Saving ${uniqueTracks.length} unique tracks to database...`
      });

      // Insert tracks in batches
      const insertBatchSize = 50;
      let importedCount = 0;

      for (let i = 0; i < uniqueTracks.length; i += insertBatchSize) {
        const batch = uniqueTracks.slice(i, i + insertBatchSize);
        
        const { error } = await supabase
          .from('songs')
          .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

        if (!error) {
          importedCount += batch.length;
        }
      }

      // Update artist sync timestamp
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artistId);

      this.updateProgress({
        status: 'completed',
        progress: 100,
        message: `Successfully imported ${importedCount} songs`,
        totalSongs: uniqueTracks.length,
        importedSongs: importedCount
      });

      return {
        success: true,
        songsImported: importedCount,
        totalSongs: uniqueTracks.length,
        message: `Imported ${importedCount} songs successfully`
      };

    } catch (error) {
      console.error('Error importing catalog:', error);
      
      this.updateProgress({
        status: 'error',
        progress: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        success: false,
        songsImported: 0,
        totalSongs: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private deduplicateTracks(tracks: any[]): any[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      const key = `${track.name.toLowerCase()}-${track.album.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async getRandomSongs(artistId: string, count: number = 5): Promise<any[]> {
    try {
      const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', artistId)
        .order('popularity', { ascending: false })
        .limit(Math.max(count * 3, 50)); // Get more songs to randomize from

      if (error || !songs || songs.length === 0) {
        return [];
      }

      // Shuffle and take the requested count
      const shuffled = songs.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error getting random songs:', error);
      return [];
    }
  }

  async getArtistSongCount(artistId: string): Promise<number> {
    try {
      const { count } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('artist_id', artistId);

      return count || 0;
    } catch (error) {
      console.error('Error getting song count:', error);
      return 0;
    }
  }
}
