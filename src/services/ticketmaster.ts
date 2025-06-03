import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

const TICKETMASTER_API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY || "k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b";
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Rate limiting
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestDelay = 200; // 5 requests per second

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.requestDelay) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay - timeSinceLastRequest));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Ticketmaster API Types
export interface TicketmasterVenue {
  id: string;
  name: string;
  type?: string;
  url?: string;
  locale?: string;
  postalCode?: string;
  timezone?: string;
  city: {
    name: string;
  };
  state?: {
    name: string;
    stateCode: string;
  };
  country: {
    name: string;
    countryCode: string;
  };
  address?: {
    line1?: string;
    line2?: string;
  };
  location?: {
    latitude: string;
    longitude: string;
  };
  boxOfficeInfo?: {
    phoneNumberDetail?: string;
    openHoursDetail?: string;
    acceptedPaymentDetail?: string;
  };
  parkingDetail?: string;
  accessibleSeatingDetail?: string;
  generalInfo?: {
    generalRule?: string;
    childRule?: string;
  };
}

export interface TicketmasterAttraction {
  id: string;
  name: string;
  type?: string;
  url?: string;
  locale?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    ratio?: string;
  }>;
  classifications?: Array<{
    primary?: boolean;
    segment?: {
      id: string;
      name: string;
    };
    genre?: {
      id: string;
      name: string;
    };
    subGenre?: {
      id: string;
      name: string;
    };
  }>;
  upcomingEvents?: {
    _total?: number;
  };
  externalLinks?: {
    spotify?: Array<{
      url: string;
    }>;
  };
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  type?: string;
  url: string;
  locale?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    ratio?: string;
  }>;
  sales?: {
    public?: {
      startDateTime?: string;
      endDateTime?: string;
      startTBD?: boolean;
      endTBD?: boolean;
    };
    presales?: Array<{
      name?: string;
      description?: string;
      url?: string;
      startDateTime?: string;
      endDateTime?: string;
    }>;
  };
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
      dateTBD?: boolean;
      dateTBA?: boolean;
      timeTBA?: boolean;
      noSpecificTime?: boolean;
    };
    end?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
    timezone?: string;
    status?: {
      code?: string;
    };
    spanMultipleDays?: boolean;
  };
  classifications?: Array<{
    primary?: boolean;
    segment?: {
      id: string;
      name: string;
    };
    genre?: {
      id: string;
      name: string;
    };
    subGenre?: {
      id: string;
      name: string;
    };
  }>;
  promoter?: {
    id: string;
    name: string;
    description?: string;
  };
  promoters?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  info?: string;
  pleaseNote?: string;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  products?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  seatmap?: {
    staticUrl?: string;
  };
  accessibility?: {
    ticketLimit?: number;
    info?: string;
  };
  ageRestrictions?: {
    legalAgeEnforced?: boolean;
    ageRuleDescription?: string;
  };
  ticketLimit?: {
    info?: string;
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
    attractions?: TicketmasterAttraction[];
  };
  _links?: {
    self?: {
      href: string;
    };
    attractions?: Array<{
      href: string;
    }>;
    venues?: Array<{
      href: string;
    }>;
  };
}

export interface TicketmasterSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
    attractions?: TicketmasterAttraction[];
    venues?: TicketmasterVenue[];
  };
  _links?: {
    self?: {
      href: string;
    };
    next?: {
      href: string;
    };
    prev?: {
      href: string;
    };
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// Cache implementation
class TicketmasterCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new TicketmasterCache();

// API Client
export class TicketmasterClient {
  private async makeRequest<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key not configured');
    }

    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    return rateLimiter.execute(async () => {
      const url = new URL(`${TICKETMASTER_BASE_URL}${endpoint}`);
      url.searchParams.append('apikey', TICKETMASTER_API_KEY);
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      cache.set(cacheKey, data);
      return data;
    });
  }

  async searchEvents(
    params: {
      keyword?: string;
      attractionId?: string;
      venueId?: string;
      postalCode?: string;
      radius?: string;
      unit?: 'miles' | 'km';
      source?: string;
      locale?: string;
      marketId?: string;
      startDateTime?: string;
      endDateTime?: string;
      size?: string;
      page?: string;
      sort?: string;
      onsaleStartDateTime?: string;
      onsaleEndDateTime?: string;
      city?: string;
      countryCode?: string;
      stateCode?: string;
      classificationName?: string[];
      classificationId?: string[];
      dmaId?: string;
      onsaleOnStartDate?: string;
      onsaleOnAfterStartDate?: string;
      segmentId?: string;
      segmentName?: string;
      includeFamily?: string;
      promoterId?: string;
      genreId?: string;
      subGenreId?: string;
      typeId?: string;
      subTypeId?: string;
      geoPoint?: string;
      preferredCountry?: string;
      includeSpellcheck?: string;
    } = {}
  ): Promise<TicketmasterSearchResponse> {
    const queryParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = value.toString();
        }
      }
    });

    return this.makeRequest<TicketmasterSearchResponse>('/events.json', queryParams);
  }

  async getEvent(eventId: string, locale?: string): Promise<TicketmasterEvent> {
    const params: Record<string, string> = {};
    if (locale) params.locale = locale;
    
    return this.makeRequest<TicketmasterEvent>(`/events/${eventId}.json`, params);
  }

  async searchAttractions(
    params: {
      keyword?: string;
      size?: string;
      page?: string;
      sort?: string;
      classificationName?: string[];
      classificationId?: string[];
      includeFamily?: string;
      segmentId?: string;
      genreId?: string;
      subGenreId?: string;
      typeId?: string;
      subTypeId?: string;
      preferredCountry?: string;
      includeSpellcheck?: string;
    } = {}
  ): Promise<TicketmasterSearchResponse> {
    const queryParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams[key] = value.join(',');
        } else {
          queryParams[key] = value.toString();
        }
      }
    });

    return this.makeRequest<TicketmasterSearchResponse>('/attractions.json', queryParams);
  }

  async getAttraction(attractionId: string, locale?: string): Promise<TicketmasterAttraction> {
    const params: Record<string, string> = {};
    if (locale) params.locale = locale;
    
    return this.makeRequest<TicketmasterAttraction>(`/attractions/${attractionId}.json`, params);
  }

  async searchVenues(
    params: {
      keyword?: string;
      size?: string;
      page?: string;
      sort?: string;
      city?: string;
      stateCode?: string;
      countryCode?: string;
      postalCode?: string;
      geoPoint?: string;
      radius?: string;
      unit?: 'miles' | 'km';
      source?: string;
      includeTest?: string;
    } = {}
  ): Promise<TicketmasterSearchResponse> {
    const queryParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value.toString();
      }
    });

    return this.makeRequest<TicketmasterSearchResponse>('/venues.json', queryParams);
  }

  async getVenue(venueId: string, locale?: string): Promise<TicketmasterVenue> {
    const params: Record<string, string> = {};
    if (locale) params.locale = locale;
    
    return this.makeRequest<TicketmasterVenue>(`/venues/${venueId}.json`, params);
  }
}

// Service class for higher-level operations
export class TicketmasterService {
  private client = new TicketmasterClient();

  async getPopularEvents(limit: number = 50): Promise<TicketmasterEvent[]> {
    try {
      logger.info("Fetching popular events from Ticketmaster");
      
      const response = await this.client.searchEvents({
        size: limit.toString(),
        sort: 'relevance,desc',
        classificationName: ['Music']
      });
      
      const events = response._embedded?.events || [];
      logger.info(`Found ${events.length} popular events`);
      return events;
    } catch (error) {
      logger.error("Error fetching popular events:", error);
      return [];
    }
  }

  async getArtistEvents(artistName: string): Promise<TicketmasterEvent[]> {
    try {
      logger.info(`Fetching events for artist: ${artistName}`);
      
      const response = await this.client.searchEvents({
        keyword: artistName,
        classificationName: ['Music'],
        size: '50',
        sort: 'date,asc'
      });
      
      const events = response._embedded?.events || [];
      logger.info(`Found ${events.length} events for ${artistName}`);
      return events;
    } catch (error) {
      logger.error(`Error fetching events for ${artistName}:`, error);
      return [];
    }
  }

  async searchEvents(keyword: string, options: {
    size?: number;
    page?: number;
    countryCode?: string;
    stateCode?: string;
    city?: string;
    startDateTime?: string;
    endDateTime?: string;
  } = {}): Promise<TicketmasterEvent[]> {
    try {
      const response = await this.client.searchEvents({
        keyword,
        size: (options.size || 20).toString(),
        page: (options.page || 0).toString(),
        classificationName: ['Music'],
        sort: 'date,asc',
        ...options
      });

      return response._embedded?.events || [];
    } catch (error) {
      logger.error('Error searching Ticketmaster events:', error);
      return [];
    }
  }

  async searchArtistByName(artistName: string): Promise<TicketmasterAttraction[]> {
    try {
      const response = await this.client.searchAttractions({
        keyword: artistName,
        size: '10',
        classificationName: ['Music']
      });
      return response._embedded?.attractions || [];
    } catch (error) {
      logger.error('Failed to search Ticketmaster attractions:', error);
      return [];
    }
  }

  async getArtistById(attractionId: string): Promise<TicketmasterAttraction | null> {
    try {
      return await this.client.getAttraction(attractionId);
    } catch (error) {
      logger.error('Failed to get Ticketmaster attraction:', error);
      return null;
    }
  }

  async syncUpcomingShows(artistId: string, ticketmasterId: string) {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      const response = await this.client.searchEvents({
        attractionId: ticketmasterId,
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate.toISOString().split('T')[0]}T23:59:59Z`,
        size: '200',
        sort: 'date,asc'
      });
      
      const events = response._embedded?.events || [];
      let syncedCount = 0;
      
      for (const event of events) {
        const venue = event._embedded?.venues?.[0];
        if (!venue) continue;

        // Skip cancelled events
        if (event.dates.status?.code === 'cancelled') {
          continue;
        }

        // Check if venue exists
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id')
          .eq('ticketmaster_id', venue.id)
          .single();

        let venueId: string;

        if (!existingVenue) {
          // Create venue
          const { data: newVenue, error: venueError } = await supabase
            .from('venues')
            .insert({
              ticketmaster_id: venue.id,
              name: venue.name,
              address: venue.address?.line1,
              city: venue.city.name,
              state: venue.state?.name,
              country: venue.country.name,
              postal_code: venue.postalCode,
              latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
              longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
              timezone: venue.timezone,
              capacity: null // Ticketmaster doesn't provide capacity
            })
            .select('id')
            .single();

          if (venueError) {
            logger.error('Failed to create venue:', venueError);
            continue;
          }
          venueId = newVenue.id;
        } else {
          venueId = existingVenue.id;
        }

        // Determine show status
        let status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' = 'upcoming';
        const eventDate = new Date(event.dates.start.localDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (event.dates.status?.code === 'cancelled') {
          status = 'cancelled';
        } else if (eventDate < today) {
          status = 'completed';
        } else if (eventDate.toDateString() === today.toDateString()) {
          status = 'ongoing';
        }

        // Create or update show
        const { error: showError } = await supabase
          .from('shows')
          .upsert({
            artist_id: artistId,
            venue_id: venueId,
            ticketmaster_id: event.id,
            date: event.dates.start.localDate,
            start_time: event.dates.start.localTime,
            doors_time: null, // Not provided by Ticketmaster
            title: event.name,
            tour_name: event.promoter?.name || event.info,
            status,
            ticketmaster_url: event.url
          }, {
            onConflict: 'ticketmaster_id'
          });

        if (showError) {
          logger.error('Failed to upsert show:', showError);
          continue;
        }
        
        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} shows from Ticketmaster for artist ${artistId}`);
      return { total: events.length, synced: syncedCount };
    } catch (error) {
      logger.error('Failed to sync Ticketmaster shows:', error);
      throw error;
    }
  }

  async syncArtistData(artistName: string) {
    try {
      const attractions = await this.searchArtistByName(artistName);
      if (attractions.length === 0) {
        logger.info(`No Ticketmaster data found for artist: ${artistName}`);
        return null;
      }

      // Use the first match
      const attraction = attractions[0];
      
      // Find the highest quality image
      const image = attraction.images?.reduce((best, current) => {
        const bestSize = (best.width || 0) * (best.height || 0);
        const currentSize = (current.width || 0) * (current.height || 0);
        return currentSize > bestSize ? current : best;
      });

      // Extract genres from classifications
      const genres = attraction.classifications?.map(c => c.genre?.name).filter(Boolean) || [];

      return {
        ticketmaster_id: attraction.id,
        name: attraction.name,
        image_url: image?.url,
        genres,
        upcoming_event_count: attraction.upcomingEvents?._total || 0,
        external_links: attraction.externalLinks
      };
    } catch (error) {
      logger.error('Failed to sync Ticketmaster artist data:', error);
      return null;
    }
  }

  // Store venue in database
  async storeVenueInDatabase(venue: TicketmasterVenue): Promise<boolean> {
    try {
      const venueData = {
        ticketmaster_id: venue.id,
        name: venue.name || 'Unknown Venue',
        city: venue.city?.name || 'Unknown City',
        state: venue.state?.name || null,
        country: venue.country?.name || 'Unknown Country',
        address: venue.address?.line1 || null,
        postal_code: venue.postalCode || null,
        latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
        longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
        timezone: venue.timezone || null
      };
      
      const { error } = await supabase
        .from('venues')
        .upsert(venueData, {
          onConflict: 'ticketmaster_id'
        });
      
      if (error) {
        logger.error("Error storing venue:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error("Error storing venue in database:", error);
      return false;
    }
  }

  // Store show in database
  async storeShowInDatabase(event: TicketmasterEvent, artistId: string, venueId: string): Promise<boolean> {
    try {
      // Ensure venue exists before creating show
      const { data: venueExists } = await supabase
        .from('venues')
        .select('id')
        .eq('id', venueId)
        .single();
      
      if (!venueExists) {
        logger.error(`Venue ${venueId} does not exist, cannot create show`);
        return false;
      }
      
      const showData = {
        ticketmaster_id: event.id,
        artist_id: artistId,
        venue_id: venueId,
        title: event.name,
        date: event.dates.start.localDate,
        start_time: event.dates.start.localTime || null,
        status: event.dates.status?.code === 'onsale' ? 'upcoming' : 'cancelled',
        ticketmaster_url: event.url || null
      };
      
      const { error } = await supabase
        .from('shows')
        .upsert(showData, {
          onConflict: 'ticketmaster_id'
        });
      
      if (error) {
        logger.error("Error storing show:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error("Error storing show in database:", error);
      return false;
    }
  }
}

// Export instances
export const ticketmasterService = new TicketmasterService();
export const ticketmasterClient = new TicketmasterClient();