import { NextRequest, NextResponse } from 'next/server'

// This API route is dynamic and should not be statically generated
export const dynamic = 'force-dynamic'

interface SpotifyArtist {
  id: string
  name: string
  popularity: number
  followers: { total: number }
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  external_urls: { spotify: string }
}

interface TicketmasterEvent {
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
    status: { code: string }
  }
  _embedded?: {
    venues?: Array<{
      id: string
      name: string
      city: { name: string }
      state: { name: string; stateCode: string }
      country: { name: string; countryCode: string }
      location?: { latitude: string; longitude: string }
    }>
    attractions?: Array<{
      id: string
      name: string
      type: string
      images?: Array<{ url: string }>
      classifications?: Array<{
        genre: { name: string }
        subGenre: { name: string }
      }>
    }>
  }
  priceRanges?: Array<{
    type: string
    currency: string
    min: number
    max: number
  }>
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
  page: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

interface SearchAnalytics {
  query: string
  timestamp: string
  source: string
  results_count: number
  user_agent?: string
}

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  return data.access_token
}

async function searchSpotifyArtists(query: string, limit: number = 5): Promise<SpotifyArtist[]> {
  try {
    const accessToken = await getSpotifyAccessToken()
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (!response.ok) {
      console.error('Spotify API error:', response.status, response.statusText)
      return []
    }
    
    const data = await response.json()
    return data.artists?.items || []
  } catch (error) {
    console.error('Error searching Spotify:', error)
    return []
  }
}

async function searchTicketmasterEvents(query: string, limit: number = 10): Promise<TicketmasterEvent[]> {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY!
    
    // Search for events by keyword (artist name)
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?` +
      `apikey=${apiKey}` +
      `&keyword=${encodeURIComponent(query)}` +
      `&countryCode=US` +
      `&classificationName=Music` +
      `&size=${limit}` +
      `&sort=relevance,desc` +
      `&includeTBA=no` +
      `&includeTBD=no`
    )
    
    if (!response.ok) {
      console.error('Ticketmaster API error:', response.status, response.statusText)
      return []
    }
    
    const data: TicketmasterResponse = await response.json()
    return data._embedded?.events || []
  } catch (error) {
    console.error('Error searching Ticketmaster:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 })
    }
    
    // Check if it's a ZIP code (5 digits)
    const isZipCode = /^\d{5}$/.test(query.trim())
    if (isZipCode) {
      return NextResponse.json({
        type: 'zip_code',
        query,
        message: 'Use local search for ZIP code queries'
      })
    }
    
    // Search both Spotify and Ticketmaster in parallel
    const [spotifyArtists, ticketmasterEvents] = await Promise.all([
      searchSpotifyArtists(query, 8),
      searchTicketmasterEvents(query, 15)
    ])
    
    // Transform Spotify results
    const artists = spotifyArtists.map(artist => ({
      id: artist.id,
      source: 'spotify',
      name: artist.name,
      popularity: artist.popularity,
      followers: artist.followers.total,
      genres: artist.genres,
      image_url: artist.images[0]?.url || null,
      spotify_url: artist.external_urls.spotify,
      can_import: true // These can be imported to our database
    }))
    
    // Transform Ticketmaster results
    const shows = ticketmasterEvents
      .filter(event => event._embedded?.venues && event._embedded?.attractions)
      .map(event => {
        const venue = event._embedded!.venues![0]
        const attraction = event._embedded!.attractions![0]
        
        return {
          id: event.id,
          source: 'ticketmaster',
          name: event.name,
          artist_name: attraction.name,
          artist_image: attraction.images?.[0]?.url || null,
          venue_name: venue.name,
          venue_city: venue.city.name,
          venue_state: venue.state.stateCode,
          date: event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00`,
          status: event.dates.status.code,
          ticket_url: event.url,
          min_price: event.priceRanges?.[0]?.min,
          max_price: event.priceRanges?.[0]?.max,
          can_import: true // These can be imported to our database
        }
      })
    
    // Filter for upcoming shows only
    const upcomingShows = shows.filter(show => new Date(show.date) > new Date())
    
    return NextResponse.json({
      type: 'external_search',
      query,
      results: {
        artists,
        shows: upcomingShows,
        spotify_count: artists.length,
        ticketmaster_count: upcomingShows.length
      }
    })
    
  } catch (error) {
    console.error('External search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}