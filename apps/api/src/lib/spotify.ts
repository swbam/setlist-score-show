import SpotifyWebApi, { SpotifyApi } from 'spotify-web-api-node'
import { logger } from './logger'
import { Redis } from 'ioredis'
import pLimit from 'p-limit'

// Local interfaces for structuring the data we care about
interface SpotifyTrack {
  id: string
  name: string
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
  artists: Array<{ id: string; name: string }>
  duration_ms: number
  popularity: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

interface SpotifyAudioFeatures {
  danceability: number
  energy: number
  key: number
  loudness: number
  mode: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
  time_signature: number
}

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: {
    total: number
  }
  images: Array<{ url: string; height: number; width: number }>
  external_urls: {
    spotify: string
  }
}

export class SpotifyClient {
  private spotify: SpotifyWebApi
  private redis?: Redis
  private tokenExpiresAt: number = 0
  private apiLimiter: any; // p-limit instance

  constructor(clientId: string, clientSecret: string, redis?: Redis, rateLimitConcurrency = 3) {
    this.spotify = new SpotifyWebApi({ clientId, clientSecret });
    this.redis = redis;
    this.apiLimiter = pLimit(rateLimitConcurrency);
  }

  private async ensureAccessToken(): Promise<void> {
    if (Date.now() < this.tokenExpiresAt - 60000) return;

    try {
      if (this.redis) {
        const cachedToken = await this.redis.get('spotify:access_token');
        const cachedExpiry = await this.redis.get('spotify:token_expires_at');
        if (cachedToken && cachedExpiry) {
          const expiryTime = parseInt(cachedExpiry, 10);
          if (Date.now() < expiryTime - 60000) {
            this.spotify.setAccessToken(cachedToken);
            this.tokenExpiresAt = expiryTime;
            return;
          }
        }
      }
      const data = await this.spotify.clientCredentialsGrant();
      const { access_token, expires_in } = data.body;
      this.spotify.setAccessToken(access_token);
      this.tokenExpiresAt = Date.now() + expires_in * 1000;
      if (this.redis) {
        await this.redis.set('spotify:access_token', access_token, 'EX', expires_in - 60);
        await this.redis.set('spotify:token_expires_at', this.tokenExpiresAt.toString(), 'EX', expires_in - 60);
      }
      logger.info('Spotify access token refreshed');
    } catch (error) {
      logger.error('Failed to get Spotify access token:', error);
      throw error;
    }
  }

  private async _request<T_ResponseData>(
    apiCall: () => Promise<SpotifyApi.Response<T_ResponseData>>
  ): Promise<T_ResponseData> {
    return this.apiLimiter(async () => {
      await this.ensureAccessToken();
      let retries = 0;
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second

      while (true) {
        try {
          const response = await apiCall();
          return response.body;
        } catch (error: any) {
          if (error.statusCode === 429 && retries < maxRetries) {
            const retryAfterHeader = error.headers?.['retry-after'];
            const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (Math.pow(2, retries) * baseDelay / 1000);
            logger.warn(`Spotify rate limit hit for ${apiCall.toString()}. Retrying in ${retryAfterSeconds}s (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
            retries++;
            await this.ensureAccessToken(); // Refresh token before retry
          } else {
            logger.error('Spotify API call failed:', { message: error.message, statusCode: error.statusCode });
            throw error;
          }
        }
      }
    });
  }

  async searchArtist(query: string): Promise<SpotifyArtist | null> {
    try {
      const responseBody = await this._request<SpotifyApi.SearchResponse>(() =>
        this.spotify.searchArtists(query, { limit: 1 })
      );
      const artist = responseBody.artists?.items[0];
      if (!artist) return null;
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity,
        followers: artist.followers,
        images: artist.images,
        external_urls: artist.external_urls,
      };
    } catch (error) {
      logger.error('Spotify artist search failed:', { query, error });
      return null;
    }
  }

  async searchArtists(query: string, options: { limit?: number } = {}): Promise<SpotifyApi.ArtistObjectFull[]> {
     try {
      const responseBody = await this._request<SpotifyApi.SearchResponse>(() =>
        this.spotify.searchArtists(query, { limit: options.limit || 10 })
      );
      // The _request helper returns the .body of the response.
      // So, responseBody here is SpotifyApi.SearchResponse.
      return responseBody.artists?.items || [];
    } catch (error) {
      logger.error('Spotify artists search failed:', { query, error });
      // Decide on error handling: throw or return empty array
      // For consistency with other methods that return [], let's return []
      return [];
    }
  }

  async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    const cacheKey = `spotify:artist:${artistId}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { logger.warn('Redis parse error for artist', { key: cacheKey, error: e });}
      }
    }
    try {
      const artistData = await this._request<SpotifyApi.SingleArtistResponse>(() => this.spotify.getArtist(artistId));
      const result: SpotifyArtist = {
        id: artistData.id,
        name: artistData.name,
        genres: artistData.genres || [],
        popularity: artistData.popularity,
        followers: artistData.followers,
        images: artistData.images,
        external_urls: artistData.external_urls,
      };
      if (this.redis) {
        await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 86400); // 24 hours
      }
      return result;
    } catch (error) {
      logger.error('Failed to get Spotify artist:', { artistId, error });
      return null;
    }
  }

  async getArtistTopTracks(artistId: string, market = 'US'): Promise<SpotifyTrack[]> {
    try {
      const responseBody = await this._request<SpotifyApi.ArtistsTopTracksResponse>(() =>
        this.spotify.getArtistTopTracks(artistId, market)
      );
      return responseBody.tracks.map(track => ({ // Map to local SpotifyTrack
        id: track.id,
        name: track.name,
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images,
        },
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
      }));
    } catch (error) {
      logger.error('Failed to get artist top tracks:', { artistId, error });
      return [];
    }
  }

  async getArtistAlbums(
    artistId: string,
    options: { limit?: number; offset?: number; include_groups?: string } = {}
  ): Promise<SpotifyApi.AlbumObjectSimplified[]> {
    try {
      const responseBody = await this._request<SpotifyApi.ArtistsAlbumsResponse>(() =>
        this.spotify.getArtistAlbums(artistId, {
          limit: options.limit || 50,
          offset: options.offset || 0,
          include_groups: options.include_groups || 'album,single,compilation', // Added compilation
        })
      );
      return responseBody.items;
    } catch (error) {
      logger.error('Failed to get artist albums:', { artistId, error });
      return [];
    }
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    try {
      const responseBody = await this._request<SpotifyApi.AlbumTracksResponse>(() =>
        this.spotify.getAlbumTracks(albumId, { limit: 50 })
      );
      return responseBody.items.map(track => ({ // Map to local SpotifyTrack
        id: track.id,
        name: track.name,
        album: { id: albumId, name: '', images: [] }, // Album info might not be complete here, might need getAlbum call
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        duration_ms: track.duration_ms,
        popularity: 0, // Not available on TrackObjectSimplified
        preview_url: track.preview_url,
        external_urls: track.external_urls,
      }));
    } catch (error) {
      logger.error('Failed to get album tracks:', { albumId, error });
      return [];
    }
  }

  async searchTrack(query: string, artist?: string): Promise<SpotifyTrack | null> {
    const searchQuery = artist ? `track:${query} artist:${artist}` : query;
    try {
      const responseBody = await this._request<SpotifyApi.TrackSearchResponse>(() =>
        this.spotify.searchTracks(searchQuery, { limit: 1 })
      );
      const track = responseBody.tracks?.items[0];
      if (!track) return null;
      return { // Map to local SpotifyTrack
        id: track.id,
        name: track.name,
        album: { id: track.album.id, name: track.album.name, images: track.album.images },
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
      };
    } catch (error) {
      logger.error('Spotify track search failed:', { query, artist, error });
      return null;
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    try {
      const track = await this._request<SpotifyApi.SingleTrackResponse>(() => this.spotify.getTrack(trackId));
      if (!track) return null;
      return { // Map to local SpotifyTrack
        id: track.id,
        name: track.name,
        album: { id: track.album.id, name: track.album.name, images: track.album.images },
        artists: track.artists.map(a => ({ id: a.id, name: a.name })),
        duration_ms: track.duration_ms,
        popularity: track.popularity,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
      };
    } catch (error) {
      logger.error('Failed to get Spotify track:', { trackId, error });
      return null;
    }
  }

  async getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
    const cacheKey = `spotify:audio_features:${trackId}`;
    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { logger.warn('Redis parse error for audio_features', {key: cacheKey, error: e});}
      }
    }
    try {
      const featuresData = await this._request<SpotifyApi.AudioFeaturesResponse>(() =>
        this.spotify.getAudioFeaturesForTrack(trackId)
      );
      if (this.redis) {
        await this.redis.set(cacheKey, JSON.stringify(featuresData), 'EX', 604800); // 7 days
      }
      return featuresData; // Assuming SpotifyAudioFeatures aligns with SpotifyApi.AudioFeaturesObject
    } catch (error) {
      logger.error('Failed to get audio features:', { trackId, error });
      return null;
    }
  }

  async getMultipleAudioFeatures(trackIds: string[]): Promise<(SpotifyAudioFeatures | null)[]> {
    const chunks: string[][] = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    const results: (SpotifyAudioFeatures | null)[] = [];
    for (const chunk of chunks) {
      try {
        const responseBody = await this._request<SpotifyApi.MultipleAudioFeaturesResponse>(() =>
          this.spotify.getAudioFeaturesForTracks(chunk)
        );
        results.push(...responseBody.audio_features.map(f => f as SpotifyAudioFeatures | null));
      } catch (error) {
        logger.error('Failed to get multiple audio features:', { error });
        results.push(...new Array(chunk.length).fill(null));
      }
    }
    return results;
  }

  async getArtistCatalog(artistId: string): Promise<{
    artist: SpotifyArtist;
    albums: SpotifyApi.AlbumObjectSimplified[];
    tracks: SpotifyTrack[];
  }> {
    const artist = await this.getArtist(artistId);
    if (!artist) {
      throw new Error(`Artist not found for ID: ${artistId}`);
    }
    const albumsResponseItems = await this.getArtistAlbums(artistId, { include_groups: 'album,single,compilation' });
    const tracks: SpotifyTrack[] = [];

    for (const album of albumsResponseItems) {
      const albumTracks = await this.getAlbumTracks(album.id);
      tracks.push(...albumTracks.map(track => ({ // Ensure full SpotifyTrack structure
        ...track,
        album: { id: album.id, name: album.name, images: album.images } // Add album context
      })));
    }
    
    // De-duplicate tracks by ID, preferring those with more complete album info if possible
    const trackMap = new Map<string, SpotifyTrack>();
    tracks.forEach(track => {
      if (!trackMap.has(track.id) || (track.album.name && !trackMap.get(track.id)?.album.name)) {
        trackMap.set(track.id, track);
      }
    });

    return { artist, albums: albumsResponseItems, tracks: Array.from(trackMap.values()) };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureAccessToken();
      return true;
    } catch {
      return false;
    }
  }
}

export class SpotifyService {
  private client: SpotifyClient;

  constructor(redis?: Redis) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }
    this.client = new SpotifyClient(clientId, clientSecret, redis, 3); // Pass concurrency
  }

  async searchArtists(query: string, options: { limit?: number } = {}): Promise<SpotifyApi.ArtistObjectFull[]> {
    // This method in SpotifyService now correctly calls the client's method
    // which already returns SpotifyApi.ArtistObjectFull[]
    return this.client.searchArtists(query, options);
  }

  async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    return this.client.getArtist(artistId);
  }

  async getArtistCatalog(artistId: string) {
    return this.client.getArtistCatalog(artistId);
  }

  async getArtistAlbums(
    artistId: string,
    options?: { limit?: number; offset?: number; include_groups?: string }
  ): Promise<SpotifyApi.AlbumObjectSimplified[]> {
    return this.client.getArtistAlbums(artistId, options);
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    return this.client.getAlbumTracks(albumId);
  }

  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}