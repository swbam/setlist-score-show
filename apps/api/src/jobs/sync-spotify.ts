import { PrismaClient } from '@setlist/database';
import { SpotifyClient } from '../lib/spotify';
import { logger } from '../lib/logger';
import pLimit from 'p-limit';

export class SpotifySyncJob {
  private limit = pLimit(5); // Max 5 concurrent API calls
  private client: SpotifyClient;
  
  constructor(
    private prisma: PrismaClient,
    clientId: string,
    clientSecret: string
  ) {
    this.client = new SpotifyClient(clientId, clientSecret);
  }

  async syncArtistCatalogs(artistIds?: string[]) {
    logger.info('Starting Spotify catalog sync');
    
    // Get artists to sync
    const artists = await this.prisma.artist.findMany({
      where: {
        spotify_id: { not: null },
        ...(artistIds ? { id: { in: artistIds } } : {})
      },
      orderBy: {
        last_synced_at: 'asc'
      },
      take: artistIds ? undefined : 50 // Limit to 50 artists per run if not specific
    });

    logger.info(`Found ${artists.length} artists to sync`);

    const results = await Promise.allSettled(
      artists.map((artist) => 
        this.limit(() => this.syncArtistCatalog(artist))
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Sync complete: ${successful} successful, ${failed} failed`);
    
    return { successful, failed };
  }

  private async syncArtistCatalog(artist: any) {
    const startTime = Date.now();
    
    try {
      logger.info(`Syncing catalog for ${artist.name} (${artist.spotify_id})`);
      
      // Get all albums
      const albums = await this.client.getArtistAlbums(artist.spotify_id, {
        include_groups: ['album', 'single', 'compilation'],
        limit: 50
      });

      let totalTracks = 0;
      let syncedTracks = 0;

      for (const album of albums) {
        // Get album tracks
        const tracks = await this.client.getAlbumTracks(album.id);
        totalTracks += tracks.length;

        for (const track of tracks) {
          // Skip tracks not by this artist
          if (!track.artists.some(a => a.id === artist.spotify_id)) {
            continue;
          }

          try {
            // Get audio features for the track
            const audioFeatures = await this.client.getAudioFeatures(track.id);

            await this.prisma.song.upsert({
              where: {
                spotify_id: track.id
              },
              create: {
                spotify_id: track.id,
                artist_id: artist.id,
                title: track.name,
                album: album.name,
                album_image_url: album.images?.[0]?.url,
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                preview_url: track.preview_url,
                spotify_url: track.external_urls.spotify,
                audio_features: audioFeatures ? {
                  acousticness: audioFeatures.acousticness,
                  danceability: audioFeatures.danceability,
                  energy: audioFeatures.energy,
                  instrumentalness: audioFeatures.instrumentalness,
                  key: audioFeatures.key,
                  liveness: audioFeatures.liveness,
                  loudness: audioFeatures.loudness,
                  mode: audioFeatures.mode,
                  speechiness: audioFeatures.speechiness,
                  tempo: audioFeatures.tempo,
                  time_signature: audioFeatures.time_signature,
                  valence: audioFeatures.valence
                } : undefined
              },
              update: {
                title: track.name,
                album: album.name,
                album_image_url: album.images?.[0]?.url,
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                preview_url: track.preview_url,
                spotify_url: track.external_urls.spotify,
                audio_features: audioFeatures ? {
                  acousticness: audioFeatures.acousticness,
                  danceability: audioFeatures.danceability,
                  energy: audioFeatures.energy,
                  instrumentalness: audioFeatures.instrumentalness,
                  key: audioFeatures.key,
                  liveness: audioFeatures.liveness,
                  loudness: audioFeatures.loudness,
                  mode: audioFeatures.mode,
                  speechiness: audioFeatures.speechiness,
                  tempo: audioFeatures.tempo,
                  time_signature: audioFeatures.time_signature,
                  valence: audioFeatures.valence
                } : undefined
              }
            });

            syncedTracks++;
          } catch (error) {
            logger.error(`Failed to sync track ${track.name}:`, error);
          }
        }
      }

      // Update artist with latest data
      const artistData = await this.client.getArtist(artist.spotify_id);
      
      await this.prisma.artist.update({
        where: { id: artist.id },
        data: {
          name: artistData.name,
          image_url: artistData.images?.[0]?.url,
          genres: artistData.genres,
          popularity: artistData.popularity,
          followers: artistData.followers.total,
          last_synced_at: new Date()
        }
      });

      // Log sync history
      await this.prisma.syncHistory.create({
        data: {
          sync_type: 'spotify',
          entity_type: 'artist',
          entity_id: artist.id,
          external_id: artist.spotify_id,
          status: 'completed',
          items_processed: syncedTracks,
          completed_at: new Date()
        }
      });

      const duration = Date.now() - startTime;
      logger.info(`Synced ${syncedTracks}/${totalTracks} tracks for ${artist.name} in ${duration}ms`);
      
      return { artist: artist.name, tracks: syncedTracks, duration };
    } catch (error) {
      logger.error(`Failed to sync artist ${artist.name}:`, error);
      
      await this.prisma.syncHistory.create({
        data: {
          sync_type: 'spotify',
          entity_type: 'artist',
          entity_id: artist.id,
          external_id: artist.spotify_id,
          status: 'failed',
          error_message: error.message
        }
      });
      
      throw error;
    }
  }

  async syncNewArtist(artistName: string) {
    try {
      logger.info(`Searching for new artist: ${artistName}`);
      
      // Search for artist on Spotify
      const searchResults = await this.client.searchArtists(artistName, { limit: 5 });
      
      if (searchResults.length === 0) {
        logger.warn(`No Spotify results found for: ${artistName}`);
        return null;
      }

      // Use the first (most relevant) result
      const spotifyArtist = searchResults[0];
      
      // Check if artist already exists
      const existingArtist = await this.prisma.artist.findUnique({
        where: { spotify_id: spotifyArtist.id }
      });

      if (existingArtist) {
        logger.info(`Artist ${artistName} already exists`);
        return existingArtist;
      }

      // Create new artist
      const artist = await this.prisma.artist.create({
        data: {
          spotify_id: spotifyArtist.id,
          name: spotifyArtist.name,
          slug: spotifyArtist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image_url: spotifyArtist.images?.[0]?.url,
          genres: spotifyArtist.genres,
          popularity: spotifyArtist.popularity,
          followers: spotifyArtist.followers.total
        }
      });

      logger.info(`Created new artist: ${artist.name}`);
      
      // Sync their catalog
      await this.syncArtistCatalog(artist);
      
      return artist;
    } catch (error) {
      logger.error(`Failed to sync new artist ${artistName}:`, error);
      throw error;
    }
  }

  async refreshArtistData() {
    logger.info('Refreshing artist data from Spotify');
    
    const artists = await this.prisma.artist.findMany({
      where: {
        spotify_id: { not: null }
      }
    });

    let updated = 0;
    
    for (const artist of artists) {
      try {
        const spotifyData = await this.client.getArtist(artist.spotify_id!);
        
        const hasChanges = 
          artist.popularity !== spotifyData.popularity ||
          artist.followers !== spotifyData.followers.total ||
          artist.image_url !== spotifyData.images?.[0]?.url;

        if (hasChanges) {
          await this.prisma.artist.update({
            where: { id: artist.id },
            data: {
              popularity: spotifyData.popularity,
              followers: spotifyData.followers.total,
              image_url: spotifyData.images?.[0]?.url,
              genres: spotifyData.genres
            }
          });
          updated++;
        }
      } catch (error) {
        logger.error(`Failed to refresh data for ${artist.name}:`, error);
      }
    }

    logger.info(`Updated ${updated} artists with fresh data`);
    return { total: artists.length, updated };
  }
}