
import { supabase } from '@/integrations/supabase/client';
import * as spotifyService from './spotify';

interface Song {
  id: string;
  artist_id: string;
  name: string;
  album: string;
  duration_ms: number;
  popularity: number;
  spotify_url: string;
}

interface CatalogImportProgress {
  total: number;
  imported: number;
  status: 'starting' | 'importing' | 'completed' | 'error';
  message?: string;
}

export class SongCatalogManager {
  private progressCallback?: (progress: CatalogImportProgress) => void;

  constructor(progressCallback?: (progress: CatalogImportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async importArtistCatalog(artistId: string): Promise<boolean> {
    try {
      this.updateProgress({
        total: 0,
        imported: 0,
        status: 'starting',
        message: 'Fetching artist albums...'
      });

      // Get artist's albums from Spotify
      const albums = await spotifyService.getArtistAlbums(artistId);
      
      let allTracks: any[] = [];
      let processedAlbums = 0;

      this.updateProgress({
        total: albums.length,
        imported: 0,
        status: 'importing',
        message: 'Fetching tracks from albums...'
      });

      // Get tracks from each album
      for (const album of albums) {
        try {
          const tracks = await spotifyService.getAlbumTracks(album.id);
          allTracks = [...allTracks, ...tracks];
          processedAlbums++;

          this.updateProgress({
            total: albums.length,
            imported: processedAlbums,
            status: 'importing',
            message: `Processed ${processedAlbums}/${albums.length} albums...`
          });

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching tracks for album ${album.id}:`, error);
        }
      }

      // Remove duplicates based on track name and artist
      const uniqueTracks = this.removeDuplicateTracks(allTracks);

      this.updateProgress({
        total: uniqueTracks.length,
        imported: 0,
        status: 'importing',
        message: 'Saving tracks to database...'
      });

      // Batch insert tracks to database
      await this.batchInsertTracks(artistId, uniqueTracks);

      this.updateProgress({
        total: uniqueTracks.length,
        imported: uniqueTracks.length,
        status: 'completed',
        message: `Successfully imported ${uniqueTracks.length} tracks`
      });

      return true;
    } catch (error) {
      console.error('Error importing artist catalog:', error);
      this.updateProgress({
        total: 0,
        imported: 0,
        status: 'error',
        message: 'Failed to import catalog'
      });
      return false;
    }
  }

  private removeDuplicateTracks(tracks: any[]): any[] {
    const seen = new Set();
    return tracks.filter(track => {
      const key = `${track.name.toLowerCase()}-${track.artists[0]?.name.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async batchInsertTracks(artistId: string, tracks: any[]): Promise<void> {
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
      const batch = tracks.slice(i, i + BATCH_SIZE);
      
      // Ensure all required fields are present and properly typed
      const songsToInsert: Song[] = batch.map(track => ({
        id: track.id,
        artist_id: artistId,
        name: track.name,
        album: track.album?.name || 'Unknown Album',
        duration_ms: track.duration_ms || 0,
        popularity: track.popularity || 0,
        spotify_url: track.external_urls?.spotify || ''
      }));

      const { error } = await supabase
        .from('songs')
        .upsert(songsToInsert, {
          onConflict: 'id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error inserting song batch:', error);
      }

      this.updateProgress({
        total: tracks.length,
        imported: Math.min(i + BATCH_SIZE, tracks.length),
        status: 'importing',
        message: `Saved ${Math.min(i + BATCH_SIZE, tracks.length)}/${tracks.length} tracks...`
      });

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private updateProgress(progress: CatalogImportProgress) {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  async getArtistSongCount(artistId: string): Promise<number> {
    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    return count || 0;
  }

  async getRandomSongs(artistId: string, limit: number = 5): Promise<Song[]> {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(limit * 3); // Get more to randomize from popular tracks

    if (!data || data.length === 0) {
      return [];
    }

    // Shuffle and take the requested number
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }
}
