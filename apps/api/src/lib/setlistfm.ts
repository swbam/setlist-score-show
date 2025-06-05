import axios from 'axios'
import { logger } from './logger'

interface SetlistFmArtist {
  mbid: string
  name: string
  sortName: string
  disambiguation?: string
  url: string
}

interface SetlistFmVenue {
  id: string
  name: string
  city: {
    id: string
    name: string
    state?: string
    stateCode?: string
    coords?: {
      lat: number
      long: number
    }
    country: {
      code: string
      name: string
    }
  }
  url: string
}

interface SetlistFmSong {
  name: string
  info?: string
  cover?: SetlistFmArtist
}

interface SetlistFmSet {
  name?: string
  encore?: number
  song: SetlistFmSong[]
}

interface SetlistFmTour {
  name: string
}

interface SetlistFmSetlist {
  id: string
  versionId: string
  eventDate: string
  lastUpdated: string
  artist: SetlistFmArtist
  venue: SetlistFmVenue
  tour?: SetlistFmTour
  sets: {
    set: SetlistFmSet[]
  }
  url: string
  info?: string
}

export class SetlistFmClient {
  private client: any // AxiosInstance type
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: 'https://api.setlist.fm/rest/1.0',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
      timeout: 10000,
    })

    // Add request/response interceptors for logging
    this.client.interceptors.request.use((config) => {
      logger.debug('Setlist.fm API request:', {
        method: config.method,
        url: config.url,
        params: config.params,
      })
      return config
    })

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Setlist.fm API response:', {
          status: response.status,
          url: response.config.url,
        })
        return response
      },
      (error) => {
        logger.error('Setlist.fm API error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        })
        throw error
      }
    )
  }

  async searchArtists(query: string, page = 1): Promise<{
    artists: SetlistFmArtist[]
    total: number
    page: number
    itemsPerPage: number
  }> {
    const response = await this.client.get('/search/artists', {
      params: {
        artistName: query,
        p: page,
        sort: 'relevance',
      },
    })
    
    return {
      artists: response.data.artist || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      itemsPerPage: response.data.itemsPerPage || 20,
    }
  }

  async getArtist(mbid: string): Promise<SetlistFmArtist> {
    const response = await this.client.get(`/artist/${mbid}`)
    return response.data
  }

  async getArtistSetlists(
    mbid: string, 
    date?: string,
    page = 1
  ): Promise<SetlistFmSetlist[]> {
    const params: any = { p: page }
    
    if (date) {
      // Format: dd-MM-yyyy
      const [year, month, day] = date.split('-')
      params.date = `${day}-${month}-${year}`
    }

    const response = await this.client.get(`/artist/${mbid}/setlists`, { params })
    return response.data.setlist || []
  }

  async getSetlist(setlistId: string): Promise<SetlistFmSetlist> {
    const response = await this.client.get(`/setlist/${setlistId}`)
    return response.data
  }

  async searchSetlists(params: {
    artistMbid?: string
    artistName?: string
    cityName?: string
    venueName?: string
    date?: string
    year?: string
    page?: number
  }): Promise<{
    setlists: SetlistFmSetlist[]
    total: number
    page: number
  }> {
    const searchParams: any = {
      p: params.page || 1,
    }

    if (params.artistMbid) searchParams.artistMbid = params.artistMbid
    if (params.artistName) searchParams.artistName = params.artistName
    if (params.cityName) searchParams.cityName = params.cityName
    if (params.venueName) searchParams.venueName = params.venueName
    if (params.date) searchParams.date = params.date
    if (params.year) searchParams.year = params.year

    const response = await this.client.get('/search/setlists', {
      params: searchParams,
    })

    return {
      setlists: response.data.setlist || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
    }
  }

  async getVenueSetlists(venueId: string, page = 1): Promise<{
    setlists: SetlistFmSetlist[]
    total: number
  }> {
    const response = await this.client.get(`/venue/${venueId}/setlists`, {
      params: { p: page },
    })

    return {
      setlists: response.data.setlist || [],
      total: response.data.total || 0,
    }
  }

  // Helper method to extract all songs from a setlist
  extractSongs(setlist: SetlistFmSetlist): string[] {
    const songs: string[] = []
    
    if (setlist.sets?.set) {
      for (const set of setlist.sets.set) {
        for (const song of set.song || []) {
          if (song.name) {
            songs.push(song.name)
          }
        }
      }
    }

    return songs
  }

  // Helper to check if API is available
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/artist/83d91898-7763-47d7-b03b-b92132375c47') // Metallica as test
      return true
    } catch (error) {
      return false
    }
  }
}