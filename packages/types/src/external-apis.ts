// Type definitions for external API integrations

// Spotify API types
export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  followers: {
    total: number
  }
  images: Array<{
    url: string
    height: number
    width: number
  }>
  external_urls: {
    spotify: string
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  album: {
    id: string
    name: string
    images: Array<{
      url: string
      height: number
      width: number
    }>
  }
  artists: SpotifyArtist[]
  duration_ms: number
  popularity: number
  preview_url?: string | null
  external_urls: {
    spotify: string
  }
}

export interface SpotifyAudioFeatures {
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  key: number
  liveness: number
  loudness: number
  mode: number
  speechiness: number
  tempo: number
  time_signature: number
  valence: number
}

// Setlist.fm API types
export interface SetlistFmArtist {
  mbid: string
  name: string
  sortName: string
  disambiguation?: string
  url: string
}

export interface SetlistFmVenue {
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

export interface SetlistFmSetlist {
  id: string
  versionId?: string
  eventDate: string
  lastUpdated?: string
  artist: SetlistFmArtist
  venue: SetlistFmVenue
  tour?: {
    name: string
  }
  sets: {
    set: Array<{
      name?: string
      encore?: number
      song: Array<{
        name: string
        with?: SetlistFmArtist
        cover?: SetlistFmArtist
        info?: string
        tape?: boolean
      }>
    }>
  }
  url: string
}

// Ticketmaster API types
export interface TicketmasterEvent {
  id: string
  name: string
  type: string
  url: string
  dates: {
    start: {
      localDate: string
      localTime?: string
      dateTime?: string
    }
    timezone?: string
    status: {
      code: string
    }
  }
  _embedded?: {
    venues?: TicketmasterVenue[]
    attractions?: TicketmasterAttraction[]
  }
  priceRanges?: Array<{
    type: string
    currency: string
    min: number
    max: number
  }>
}

export interface TicketmasterVenue {
  id: string
  name: string
  type: string
  url?: string
  postalCode?: string
  timezone?: string
  city: {
    name: string
  }
  state?: {
    name: string
    stateCode: string
  }
  country: {
    name: string
    countryCode: string
  }
  location?: {
    longitude: string
    latitude: string
  }
  markets?: Array<{
    id: string
    name: string
  }>
  dmas?: Array<{
    id: number
  }>
}

export interface TicketmasterAttraction {
  id: string
  name: string
  type: string
  url: string
  classifications?: Array<{
    primary: boolean
    segment: {
      id: string
      name: string
    }
    genre?: {
      id: string
      name: string
    }
    subGenre?: {
      id: string
      name: string
    }
  }>
  images?: Array<{
    ratio: string
    url: string
    width: number
    height: number
    fallback: boolean
  }>
}

// Rate limiting
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}