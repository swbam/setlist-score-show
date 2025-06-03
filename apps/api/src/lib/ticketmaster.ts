// src/lib/ticketmaster.ts
import axios, { AxiosInstance } from 'axios'
import pLimit from 'p-limit'
import { z } from 'zod'

// Ticketmaster API response schemas
const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  city: z.object({
    name: z.string()
  }),
  state: z.object({
    name: z.string(),
    stateCode: z.string()
  }).optional(),
  country: z.object({
    name: z.string(),
    countryCode: z.string()
  }),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional()
  }).optional(),
  location: z.object({
    longitude: z.string(),
    latitude: z.string()
  }).optional(),
  postalCode: z.string().optional()
})

const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  locale: z.string().optional(),
  images: z.array(z.object({
    ratio: z.string().optional(),
    url: z.string(),
    width: z.number(),
    height: z.number()
  })).optional(),
  dates: z.object({
    start: z.object({
      localDate: z.string(),
      localTime: z.string().optional(),
      dateTime: z.string().optional()
    }),
    status: z.object({
      code: z.string()
    }).optional(),
    spanMultipleDays: z.boolean().optional()
  }),
  sales: z.object({
    public: z.object({
      startDateTime: z.string().optional(),
      endDateTime: z.string().optional()
    }).optional()
  }).optional(),
  priceRanges: z.array(z.object({
    type: z.string(),
    currency: z.string(),
    min: z.number(),
    max: z.number()
  })).optional(),
  _embedded: z.object({
    venues: z.array(VenueSchema),
    attractions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      url: z.string().optional()
    })).optional()
  })
})

const EventsResponseSchema = z.object({
  _embedded: z.object({
    events: z.array(EventSchema)
  }).optional(),
  page: z.object({
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    number: z.number()
  })
})

export interface TicketmasterConfig {
  apiKey: string
  baseUrl?: string
  rateLimit?: number
}

export interface EventSearchParams {
  startDate?: Date
  endDate?: Date
  city?: string
  stateCode?: string
  countryCode?: string
  radius?: number
  unit?: 'miles' | 'km'
  size?: number
  page?: number
  sort?: string
  includeTest?: boolean
}

export class TicketmasterClient {
  private client: AxiosInstance
  private apiKey: string
  private limit: pLimit.Limit

  constructor(config: TicketmasterConfig) {
    this.apiKey = config.apiKey
    this.limit = pLimit(config.rateLimit || 5) // Default 5 requests per second

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://app.ticketmaster.com/discovery/v2',
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    })

    // Request interceptor
    this.client.interceptors.request.use((config) => {
      // Add API key to all requests
      config.params = {
        ...config.params,
        apikey: this.apiKey
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limited
          const retryAfter = error.response.headers['retry-after'] || 60
          console.warn(`Ticketmaster rate limit hit. Waiting ${retryAfter}s`)
          await this.delay(retryAfter * 1000)
          return this.client.request(error.config)
        }
        
        throw error
      }
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async searchEvents(params: EventSearchParams = {}) {
    return this.limit(async () => {
      const queryParams: any = {
        size: params.size || 20,
        page: params.page || 0,
        sort: params.sort || 'date,asc'
      }

      if (params.startDate) {
        queryParams.startDateTime = params.startDate.toISOString().replace(/\.\d{3}Z$/, 'Z')
      }

      if (params.endDate) {
        queryParams.endDateTime = params.endDate.toISOString().replace(/\.\d{3}Z$/, 'Z')
      }

      if (params.city) queryParams.city = params.city
      if (params.stateCode) queryParams.stateCode = params.stateCode
      if (params.countryCode) queryParams.countryCode = params.countryCode
      if (params.radius) queryParams.radius = params.radius
      if (params.unit) queryParams.unit = params.unit
      if (params.includeTest === false) queryParams.includeTest = 'no'

      const response = await this.client.get('/events.json', { params: queryParams })
      
      const validated = EventsResponseSchema.parse(response.data)
      return validated._embedded?.events || []
    })
  }

  async getArtistEvents(artistId: string, params: EventSearchParams = {}) {
    return this.limit(async () => {
      const queryParams: any = {
        attractionId: artistId,
        size: params.size || 50,
        page: params.page || 0,
        sort: params.sort || 'date,asc'
      }

      if (params.startDate) {
        queryParams.startDateTime = params.startDate.toISOString().replace(/\.\d{3}Z$/, 'Z')
      }

      if (params.endDate) {
        queryParams.endDateTime = params.endDate.toISOString().replace(/\.\d{3}Z$/, 'Z')
      }

      const response = await this.client.get('/events.json', { params: queryParams })
      
      const validated = EventsResponseSchema.parse(response.data)
      return validated._embedded?.events || []
    })
  }

  async getEvent(eventId: string) {
    return this.limit(async () => {
      const response = await this.client.get(`/events/${eventId}.json`)
      return EventSchema.parse(response.data)
    })
  }

  async searchAttractions(keyword: string, params: { size?: number; page?: number } = {}) {
    return this.limit(async () => {
      const queryParams = {
        keyword,
        size: params.size || 20,
        page: params.page || 0
      }

      const response = await this.client.get('/attractions.json', { params: queryParams })
      
      return response.data._embedded?.attractions || []
    })
  }

  async getAttraction(attractionId: string) {
    return this.limit(async () => {
      const response = await this.client.get(`/attractions/${attractionId}.json`)
      return response.data
    })
  }

  async getVenue(venueId: string) {
    return this.limit(async () => {
      const response = await this.client.get(`/venues/${venueId}.json`)
      return VenueSchema.parse(response.data)
    })
  }

  // Helper method to search for artists
  async searchArtists(query: string) {
    const attractions = await this.searchAttractions(query, { size: 10 })
    
    // Filter to only music artists
    return attractions.filter((attraction: any) => 
      attraction.classifications?.some((c: any) => 
        c.segment?.name === 'Music' || c.genre?.name === 'Music'
      )
    )
  }

  // Get all events for multiple artists
  async getMultipleArtistEvents(
    artistIds: string[], 
    params: EventSearchParams = {}
  ) {
    const allEvents = await Promise.all(
      artistIds.map(id => this.getArtistEvents(id, params))
    )
    
    // Flatten and deduplicate by event ID
    const eventMap = new Map()
    allEvents.flat().forEach(event => {
      eventMap.set(event.id, event)
    })
    
    return Array.from(eventMap.values())
  }

  // Parse Ticketmaster event to our schema format
  parseEvent(event: z.infer<typeof EventSchema>) {
    const venue = event._embedded.venues[0]
    const attraction = event._embedded.attractions?.[0]
    
    return {
      ticketmaster_id: event.id,
      name: event.name,
      date: event.dates.start.localDate,
      time: event.dates.start.localTime,
      url: event.url,
      status: event.dates.status?.code || 'onsale',
      venue: {
        ticketmaster_id: venue.id,
        name: venue.name,
        address: venue.address?.line1,
        city: venue.city.name,
        state: venue.state?.name,
        state_code: venue.state?.stateCode,
        country: venue.country.name,
        country_code: venue.country.countryCode,
        postal_code: venue.postalCode,
        latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
        longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
        timezone: venue.timezone
      },
      artist: attraction ? {
        ticketmaster_id: attraction.id,
        name: attraction.name
      } : undefined,
      price_range: event.priceRanges?.[0] ? {
        currency: event.priceRanges[0].currency,
        min: event.priceRanges[0].min,
        max: event.priceRanges[0].max
      } : undefined,
      images: event.images
    }
  }
}