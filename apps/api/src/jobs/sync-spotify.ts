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
        spotifyId: { not: null },
        ...(artistIds ? { id: { in: artistIds } } : {})
      },
      orderBy: {
        lastSyncedAt: 'asc'
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
      logger.info(`Syncing catalog for ${artist.name} (${artist.spotifyId})`);
      
      // Get all albums using pagination  
      const albums = await this.client.getAllArtistAlbums(artist.spotifyId, { 
        include_groups: 'album,single,compilation' 
      });

      let totalTracks = 0;
      let syncedTracks = 0;

      for (const album of albums) {
        // Get album tracks
        const tracks = await this.client.getAlbumTracks(album.id);
        totalTracks += tracks.length;

        for (const track of tracks) {
          // Skip tracks not by this artist
          if (!track.artists.some(a => a.id === artist.spotifyId)) {
            continue;
          }

          try {
            // Get audio features for the track
            const audioFeatures = await this.client.getAudioFeatures(track.id);

            await this.prisma.song.upsert({
              where: {
                spotifyId: track.id
              },
              create: {
                spotifyId: track.id,
                artistId: artist.id,
                title: track.name,
                album: album.name,
                albumImageUrl: album.images?.[0]?.url,
                durationMs: track.duration_ms,
                popularity: track.popularity,
                previewUrl: track.preview_url,
                spotifyUrl: track.external_urls.spotify,
                audioFeatures: audioFeatures ? {
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
                  timeSignature: audioFeatures.time_signature,
                  valence: audioFeatures.valence
                } : undefined
              },
              update: {
                title: track.name,
                album: album.name,
                albumImageUrl: album.images?.[0]?.url,
                durationMs: track.duration_ms,
                popularity: track.popularity,
                previewUrl: track.preview_url,
                spotifyUrl: track.external_urls.spotify,
                audioFeatures: audioFeatures ? {
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
                  timeSignature: audioFeatures.time_signature,
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
      const artistData = await this.client.getArtist(artist.spotifyId);
      
      await this.prisma.artist.update({
        where: { id: artist.id },
        data: {
          name: artistData.name,
          imageUrl: artistData.images?.[0]?.url,
          genres: artistData.genres,
          popularity: artistData.popularity,
          followers: artistData.followers.total,
          lastSyncedAt: new Date()
        }
      });

      // Log sync history
      await this.prisma.syncHistory.create({
        data: {
          syncType: 'spotify',
          entityType: 'artist',
          entityId: artist.id,
          externalId: artist.spotifyId,
          status: 'completed',
          itemsProcessed: syncedTracks,
          completedAt: new Date()
        }
      });

      const duration = Date.now() - startTime;
      logger.info(`Synced ${syncedTracks}/${totalTracks} tracks for ${artist.name} in ${duration}ms`);
      
      return { artist: artist.name, tracks: syncedTracks, duration };
    } catch (error) {
      logger.error(`Failed to sync artist ${artist.name}:`, error);
      
      await this.prisma.syncHistory.create({
        data: {
          syncType: 'spotify',
          entityType: 'artist',
          entityId: artist.id,
          externalId: artist.spotifyId,
          status: 'failed',
          errorMessage: error.message
        }
      });
      
      throw error;
    }
  }

  async syncNewArtist(artistName: string) {
    try {
      logger.info(`Searching for new artist: ${artistName}`);
      
      // Search for artist on Spotify
      const searchResults = await this.client.searchArtist(artistName);
      
      if (!Array.isArray(searchResults) || searchResults.length === 0) {
        logger.warn(`No Spotify results found for: ${artistName}`);
        return null;
      }

      // Use the first (most relevant) result
      const spotifyArtist = searchResults[0];
      
      // Check if artist already exists
      const existingArtist = await this.prisma.artist.findUnique({
        where: { spotifyId: spotifyArtist.id }
      });

      if (existingArtist) {
        logger.info(`Artist ${artistName} already exists`);
        return existingArtist;
      }

      // Create new artist
      const artist = await this.prisma.artist.create({
        data: {
          spotifyId: spotifyArtist.id,
          name: spotifyArtist.name,
          slug: spotifyArtist.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          imageUrl: spotifyArtist.images?.[0]?.url,
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
        spotifyId: { not: null }
      }
    });

    let updated = 0;
    
    for (const artist of artists) {
      try {
        const spotifyData = await this.client.getArtist(artist.spotifyId!);
        
        const hasChanges = 
          artist.popularity !== spotifyData.popularity ||
          artist.followers !== spotifyData.followers.total ||
          artist.imageUrl !== spotifyData.images?.[0]?.url;

        if (hasChanges) {
          await this.prisma.artist.update({
            where: { id: artist.id },
            data: {
              popularity: spotifyData.popularity,
              followers: spotifyData.followers.total,
              imageUrl: spotifyData.images?.[0]?.url,
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