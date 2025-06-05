import SpotifyWebApi from 'spotify-web-api-node'
import { logger } from './logger'
import { Redis } from 'ioredis'

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

  constructor(clientId: string, clientSecret: string, redis?: Redis) {
    this.spotify = new SpotifyWebApi({
      clientId,
      clientSecret,
    })
    this.redis = redis
  }

  private async ensureAccessToken(): Promise<void> {
    if (Date.now() < this.tokenExpiresAt - 60000) {
      // Token is still valid for at least 1 minute
      return
    }

    try {
      // Check Redis cache first
      if (this.redis) {
        const cachedToken = await this.redis.get('spotify:access_token')
        const cachedExpiry = await this.redis.get('spotify:token_expires_at')
        
        if (cachedToken && cachedExpiry) {
          const expiryTime = parseInt(cachedExpiry, 10)
          if (Date.now() < expiryTime - 60000) {
            this.spotify.setAccessToken(cachedToken)
            this.tokenExpiresAt = expiryTime
            return
          }
        }
      }

      // Get new token
      const data = await this.spotify.clientCredentialsGrant()
      const { access_token, expires_in } = data.body
      
      this.spotify.setAccessToken(access_token)
      this.tokenExpiresAt = Date.now() + expires_in * 1000

      // Cache in Redis
      if (this.redis) {
        await this.redis.set('spotify:access_token', access_token, 'EX', expires_in - 60)
        await this.redis.set('spotify:token_expires_at', this.tokenExpiresAt.toString(), 'EX', expires_in - 60)
      }

      logger.info('Spotify access token refreshed')
    } catch (error) {
      logger.error('Failed to get Spotify access token:', error)
      throw error
    }
  }

  async searchArtist(query: string): Promise<SpotifyArtist | null> {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.searchArtists(query, { limit: 1 })
      const artist = response.body.artists?.items[0]
      
      if (!artist) return null

      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity,
        followers: artist.followers,
        images: artist.images,
        external_urls: artist.external_urls,
      }
    } catch (error) {
      logger.error('Spotify artist search failed:', { query, error })
      return null
    }
  }

  async searchArtists(query: string, options: { limit?: number } = {}) {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.searchArtists(query, { limit: options.limit || 10 })
      return response
    } catch (error) {
      logger.error('Spotify artists search failed:', { query, error })
      throw error
    }
  }

  async getArtist(artistId: string): Promise<SpotifyArtist | null> {
    await this.ensureAccessToken()

    // Check cache first
    if (this.redis) {
      const cached = await this.redis.get(`spotify:artist:${artistId}`)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    try {
      const response = await this.spotify.getArtist(artistId)
      const artist = response.body

      const result: SpotifyArtist = {
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        popularity: artist.popularity,
        followers: artist.followers,
        images: artist.images,
        external_urls: artist.external_urls,
      }

      // Cache for 24 hours
      if (this.redis) {
        await this.redis.set(
          `spotify:artist:${artistId}`,
          JSON.stringify(result),
          'EX',
          86400
        )
      }

      return result
    } catch (error) {
      logger.error('Failed to get Spotify artist:', { artistId, error })
      return null
    }
  }

  async getArtistTopTracks(artistId: string, market = 'US'): Promise<SpotifyTrack[]> {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.getArtistTopTracks(artistId, market)
      return response.body.tracks as SpotifyTrack[]
    } catch (error) {
      logger.error('Failed to get artist top tracks:', { artistId, error })
      return []
    }
  }

  async getArtistAlbums(
    artistId: string,
    options: { limit?: number; offset?: number; include_groups?: string } = {}
  ): Promise<any[]> {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.getArtistAlbums(artistId, {
        limit: options.limit || 50,
        offset: options.offset || 0,
        include_groups: options.include_groups || 'album,single',
      })
      return response.body.items
    } catch (error) {
      logger.error('Failed to get artist albums:', { artistId, error })
      return []
    }
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.getAlbumTracks(albumId, { limit: 50 })
      return response.body.items as SpotifyTrack[]
    } catch (error) {
      logger.error('Failed to get album tracks:', { albumId, error })
      return []
    }
  }

  async searchTrack(query: string, artist?: string): Promise<SpotifyTrack | null> {
    await this.ensureAccessToken()

    const searchQuery = artist ? `track:${query} artist:${artist}` : query

    try {
      const response = await this.spotify.searchTracks(searchQuery, { limit: 1 })
      const track = response.body.tracks?.items[0]
      
      return track || null
    } catch (error) {
      logger.error('Spotify track search failed:', { query, artist, error })
      return null
    }
  }

  async getTrack(trackId: string): Promise<SpotifyTrack | null> {
    await this.ensureAccessToken()

    try {
      const response = await this.spotify.getTrack(trackId)
      return response.body as SpotifyTrack
    } catch (error) {
      logger.error('Failed to get Spotify track:', { trackId, error })
      return null
    }
  }

  async getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
    await this.ensureAccessToken()

    // Check cache first
    if (this.redis) {
      const cached = await this.redis.get(`spotify:audio_features:${trackId}`)
      if (cached) {
        return JSON.parse(cached)
      }
    }

    try {
      const response = await this.spotify.getAudioFeaturesForTrack(trackId)
      const features = response.body

      // Cache for 7 days
      if (this.redis) {
        await this.redis.set(
          `spotify:audio_features:${trackId}`,
          JSON.stringify(features),
          'EX',
          604800
        )
      }

      return features
    } catch (error) {
      logger.error('Failed to get audio features:', { trackId, error })
      return null
    }
  }

  async getMultipleAudioFeatures(trackIds: string[]): Promise<(SpotifyAudioFeatures | null)[]> {
    await this.ensureAccessToken()

    // Spotify limits to 100 tracks per request
    const chunks: string[][] = []
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100))
    }

    const results: (SpotifyAudioFeatures | null)[] = []

    for (const chunk of chunks) {
      try {
        const response = await this.spotify.getAudioFeaturesForTracks(chunk)
        results.push(...response.body.audio_features)
      } catch (error) {
        logger.error('Failed to get multiple audio features:', { error })
        // Fill with nulls for failed chunk
        results.push(...new Array(chunk.length).fill(null))
      }
    }

    return results
  }

  // Get full artist catalog (all albums and tracks)
  async getArtistCatalog(artistId: string): Promise<{
    artist: SpotifyArtist
    albums: any[]
    tracks: SpotifyTrack[]
  }> {
    const artist = await this.getArtist(artistId)
    if (!artist) {
      throw new Error('Artist not found')
    }

    const albums = await this.getArtistAlbums(artistId)
    const tracks: SpotifyTrack[] = []

    // Get all tracks from all albums
    for (const album of albums) {
      const albumTracks = await this.getAlbumTracks(album.id)
      tracks.push(...albumTracks)
    }

    // Add top tracks that might not be in albums
    const topTracks = await this.getArtistTopTracks(artistId)
    for (const track of topTracks) {
      if (!tracks.find(t => t.id === track.id)) {
        tracks.push(track)
      }
    }

    return { artist, albums, tracks }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureAccessToken()
      await this.spotify.getMe()
      return true
    } catch {
      return false
    }
  }
}

// Service wrapper for easy DI
export class SpotifyService {
  private client: SpotifyClient

  constructor(redis?: Redis) {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured')
    }

    this.client = new SpotifyClient(clientId, clientSecret, redis)
  }

  async searchArtists(query: string, options: { limit?: number } = {}) {
    return this.client.searchArtists(query, options)
  }

  async getArtist(artistId: string) {
    return this.client.getArtist(artistId)
  }

  async getArtistCatalog(artistId: string) {
    return this.client.getArtistCatalog(artistId)
  }

  async healthCheck() {
    return this.client.healthCheck()
  }
}