import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get('zip')

    if (!zip || !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: 'Valid 5-digit zip code required' }, { status: 400 })
    }

    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY
    if (!ticketmasterApiKey) {
      return NextResponse.json({ error: 'Ticketmaster API key not configured' }, { status: 500 })
    }

    // Search for concerts within 30 miles of the zip code
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json')
    url.searchParams.append('apikey', ticketmasterApiKey)
    url.searchParams.append('classificationName', 'Music')
    url.searchParams.append('postalCode', zip)
    url.searchParams.append('radius', '30') // 30 mile radius
    url.searchParams.append('unit', 'miles')
    url.searchParams.append('size', '20')
    url.searchParams.append('sort', 'relevance,desc') // Sort by popularity/relevance
    url.searchParams.append('startDateTime', new Date().toISOString())
    
    // Get events for next 6 months
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 6)
    url.searchParams.append('endDateTime', endDate.toISOString())

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      console.error('Ticketmaster API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const data = await response.json()
    const events = data._embedded?.events || []

    // Transform events into our format
    const shows = events.map((event: any) => {
      const artist = event._embedded?.attractions?.[0]
      const venue = event._embedded?.venues?.[0]
      
      return {
        artistId: artist?.id,
        artistName: artist?.name || 'Unknown Artist',
        artistImage: artist?.images?.[0]?.url,
        venueName: venue?.name || 'Unknown Venue',
        venueCity: venue?.city?.name,
        venueState: venue?.state?.stateCode,
        date: new Date(event.dates?.start?.localDate || event.dates?.start?.dateTime).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        distance: venue?.distance ? Math.round(parseFloat(venue.distance)) : null,
        ticketmasterUrl: event.url,
        priceRange: event.priceRanges?.[0] ? 
          `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : null
      }
    }).filter((show: any) => show.artistName !== 'Unknown Artist')

    return NextResponse.json({ 
      shows,
      total: shows.length,
      zipCode: zip
    })

  } catch (error) {
    console.error('Zip code search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 