import { supabase } from '@/integrations/supabase/client';
import { spotifyRateLimiter } from './productionRateLimiter';
import { getSpotifyAccessToken } from '../spotify';

interface ImportProgress {
  artistId: string;
  totalAlbums: number;
  processedAlbums: number;
  totalTracks: number;
  processedTracks: number;
  errors: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  release_date: string;
  total_tracks: number;
  images: { url: string }[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  track_number: number;
  disc_number: number;
}

export class SpotifyCatalogImporter {
  private progress: Map<string, ImportProgress> = new Map();
  
  async importArtistCatalog(artistId: string, spotifyArtistId: string): Promise<ImportProgress> {
    console.log(`Starting catalog import for artist ${artistId} (Spotify: ${spotifyArtistId})`);
    
    const progress: ImportProgress = {
      artistId,
      totalAlbums: 0,
      processedAlbums: 0,
      totalTracks: 0,
      processedTracks: 0,
      errors: [],
      status: 'processing',
      startedAt: new Date()
    };
    
    this.progress.set(artistId, progress);
    
    try {
      // Get all albums (including singles, compilations)
      const albums = await this.getAllArtistAlbums(spotifyArtistId);
      progress.totalAlbums = albums.length;
      console.log(`Found ${albums.length} albums to process`);
      
      // Process albums in batches to avoid memory issues
      const BATCH_SIZE = 5;
      for (let i = 0; i < albums.length; i += BATCH_SIZE) {
        const batch = albums.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(album => this.processAlbum(artistId, album, progress)));
        
        // Update progress in database periodically
        if (i % 10 === 0) {
          await this.updateProgressInDb(progress);
        }
      }
      
      // Update artist sync status
      await supabase
        .from('artists')
        .update({ 
          last_synced_at: new Date().toISOString(),
          total_songs: progress.processedTracks
        })
        .eq('id', artistId);
      
      progress.status = 'completed';
      progress.completedAt = new Date();
      
      console.log(`Catalog import completed: ${progress.processedTracks} tracks imported`);
    } catch (error: any) {
      progress.status = 'failed';
      progress.errors.push(error.message);
      console.error('Catalog import failed:', error);
    }
    
    // Final progress update
    await this.updateProgressInDb(progress);
    
    return progress;
  }
  
  private async getAllArtistAlbums(spotifyArtistId: string): Promise<SpotifyAlbum[]> {
    const albums: SpotifyAlbum[] = [];
    let offset = 0;
    const limit = 50;
    const token = await getSpotifyAccessToken();
    
    while (true) {
      const response = await spotifyRateLimiter.enqueue(() =>
        fetch(
          `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?` +
          `limit=${limit}&offset=${offset}&include_groups=album,single,compilation`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch albums: ${response.status}`);
      }
      
      const data = await response.json();
      albums.push(...data.items);
      
      if (data.items.length < limit) break;
      offset += limit;
      
      // Log progress
      if (offset % 100 === 0) {
        console.log(`Fetched ${albums.length} albums so far...`);
      }
    }
    
    return albums;
  }
  
  private async processAlbum(artistId: string, album: SpotifyAlbum, progress: ImportProgress) {
    try {
      const tracks = await this.getAlbumTracks(album.id);
      progress.totalTracks += tracks.length;
      
      // Prepare songs for batch insert
      const songs = tracks.map(track => ({
        artist_id: artistId,
        name: track.name,
        album: album.name,
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        spotify_url: track.external_urls.spotify,
        spotify_id: track.id,
        preview_url: track.preview_url,
        album_image_url: album.images?.[0]?.url,
        source: 'spotify'
      }));
      
      // Batch insert with conflict handling
      const { error } = await supabase
        .from('songs')
        .upsert(songs, { 
          onConflict: 'spotify_id',
          ignoreDuplicates: false // Update existing songs
        });
      
      if (error) {
        throw error;
      }
      
      progress.processedTracks += tracks.length;
      progress.processedAlbums++;
      
      // Log progress
      if (progress.processedAlbums % 10 === 0) {
        console.log(`Processed ${progress.processedAlbums}/${progress.totalAlbums} albums`);
      }
    } catch (error: any) {
      progress.errors.push(`Failed to process album ${album.name}: ${error.message}`);
      console.error(`Error processing album ${album.name}:`, error);
    }
  }
  
  private async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;
    const token = await getSpotifyAccessToken();
    
    while (true) {
      const response = await spotifyRateLimiter.enqueue(() =>
        fetch(
          `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status}`);
      }
      
      const data = await response.json();
      tracks.push(...data.items);
      
      if (data.items.length < limit) break;
      offset += limit;
    }
    
    return tracks;
  }
  
  private async updateProgressInDb(progress: ImportProgress) {
    // Store progress in a dedicated table or as metadata
    const { error } = await supabase
      .from('artist_import_progress')
      .upsert({
        artist_id: progress.artistId,
        status: progress.status,
        total_albums: progress.totalAlbums,
        processed_albums: progress.processedAlbums,
        total_tracks: progress.totalTracks,
        processed_tracks: progress.processedTracks,
        errors: progress.errors,
        started_at: progress.startedAt,
        completed_at: progress.completedAt,
        updated_at: new Date()
      });
      
    if (error) {
      console.error('Failed to update progress in database:', error);
    }
  }
  
  getProgress(artistId: string): ImportProgress | undefined {
    return this.progress.get(artistId);
  }
  
  getAllProgress(): ImportProgress[] {
    return Array.from(this.progress.values());
  }
  
  // Resume incomplete imports
  async resumeIncompleteImports() {
    const { data: incompleteImports } = await supabase
      .from('artist_import_progress')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('started_at', { ascending: true });
      
    if (!incompleteImports) return;
    
    for (const importJob of incompleteImports) {
      // Get Spotify ID
      const { data: artist } = await supabase
        .from('artists')
        .select('spotify_id')
        .eq('id', importJob.artist_id)
        .single();
        
      if (artist?.spotify_id) {
        console.log(`Resuming import for artist ${importJob.artist_id}`);
        this.importArtistCatalog(importJob.artist_id, artist.spotify_id);
      }
    }
  }
}

// Export singleton instance
export const catalogImporter = new SpotifyCatalogImporter();

// Resume incomplete imports on startup
catalogImporter.resumeIncompleteImports();