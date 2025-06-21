import { NextRequest, NextResponse } from 'next/server'

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 })
    }

    if (!TICKETMASTER_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticketmaster API key not configured' 
      }, { status: 500 })
    }

    console.log(`🔍 Searching Ticketmaster for artists: "${query}"`)

    // Clean up query for better search results
    const cleanQuery = query.replace(/[^\w\s]/g, '').trim()

    // Primary search: events with keyword
    let artists = []
    
    try {
      const ticketmasterUrl = new URL('https://app.ticketmaster.com/discovery/v2/events')
      ticketmasterUrl.searchParams.append('apikey', TICKETMASTER_API_KEY)
      ticketmasterUrl.searchParams.append('keyword', cleanQuery)
      ticketmasterUrl.searchParams.append('classificationName', 'Music')
      ticketmasterUrl.searchParams.append('countryCode', 'US')
      ticketmasterUrl.searchParams.append('size', '50')
      ticketmasterUrl.searchParams.append('sort', 'relevance,desc')
      
      // Search upcoming shows (next 2 years)
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      ticketmasterUrl.searchParams.append('startDateTime', `${startDate}T00:00:00Z`)
      ticketmasterUrl.searchParams.append('endDateTime', `${endDate}T23:59:59Z`)

      console.log('🌐 Fetching from Ticketmaster API...')
      const response = await fetch(ticketmasterUrl.toString())
      
      if (!response.ok) {
        console.warn(`⚠️ Ticketmaster API returned ${response.status}: ${response.statusText}`)
      } else {
        const data = await response.json()
        const events = data._embedded?.events || []
        
        console.log(`📊 Found ${events.length} events from Ticketmaster`)
        artists = extractArtistsFromEvents(events, query)
      }
    } catch (apiError) {
      console.warn('⚠️ Ticketmaster API failed:', apiError)
    }

    // Fallback: search our local database for existing artists
    if (artists.length === 0) {
      console.log('🔄 Falling back to local database search...')
      
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      )
      
      const { data: localArtists } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genres,
          ticketmaster_id,
          shows(
            id,
            status
          )
        `)
        .ilike('name', `%${cleanQuery}%`)
        .order('popularity', { ascending: false })
        .limit(10)
      
      if (localArtists && localArtists.length > 0) {
        artists = localArtists.map(artist => {
          const upcomingShows = artist.shows?.filter(show => show.status === 'upcoming') || []
          return {
            id: artist.ticketmaster_id || artist.id,
            name: artist.name,
            imageUrl: artist.image_url,
            genres: artist.genres || [],
            upcomingShowsCount: upcomingShows.length,
            relevanceScore: calculateRelevanceScore(artist.name, query),
            ticketmasterId: artist.ticketmaster_id || artist.id,
            slug: artist.slug
          }
        })
        
        console.log(`📱 Found ${artists.length} artists from local database`)
      }
    }

    // If still no results, return empty but successful response
    if (artists.length === 0) {
      console.log('❌ No artists found for query:', query)
      return NextResponse.json({
        success: true,
        artists: [],
        total: 0,
        query: query,
        message: 'No artists found matching your search'
      })
    }

    console.log(`🎤 Returning ${artists.length} unique artists`)

    return NextResponse.json({
      success: true,
      artists: artists.slice(0, 20), // Limit to top 20 results
      total: artists.length,
      query: query
    })

  } catch (error) {
    console.error('❌ Search API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed',
      artists: [],
      total: 0
    }, { status: 500 })
  }
}

function extractArtistsFromEvents(events: any[], query: string) {
  const artistMap = new Map()
  
  for (const event of events) {
    const attractions = event._embedded?.attractions || []
    
    for (const attraction of attractions) {
      if (!attraction.id || !attraction.name) continue
      
      // Skip if this doesn't match our search query (fuzzy match)
      const artistName = attraction.name.toLowerCase()
      const searchQuery = query.toLowerCase()
      
      if (!artistName.includes(searchQuery) && 
          !searchQuery.split(' ').some(word => artistName.includes(word))) {
        continue
      }
      
      const artistId = attraction.id
      
      if (artistMap.has(artistId)) {
        // Artist already exists, increment show count
        const existing = artistMap.get(artistId)
        existing.upcomingShowsCount++
      } else {
        // New artist
        artistMap.set(artistId, {
          id: artistId,
          name: attraction.name,
          imageUrl: attraction.images?.find(img => img.ratio === '16_9' || img.ratio === '4_3')?.url || null,
          genres: attraction.classifications?.[0]?.genre?.name ? [attraction.classifications[0].genre.name] : [],
          upcomingShowsCount: 1,
          relevanceScore: calculateRelevanceScore(attraction.name, query),
          ticketmasterId: artistId,
          slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        })
      }
    }
  }

  return Array.from(artistMap.values())
    .sort((a, b) => {
      // Primary sort: relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Secondary sort: number of upcoming shows
      if (a.upcomingShowsCount !== b.upcomingShowsCount) {
        return b.upcomingShowsCount - a.upcomingShowsCount
      }
      // Tertiary sort: name alphabetically
      return a.name.localeCompare(b.name)
    })
}

function calculateRelevanceScore(artistName: string, query: string): number {
  const name = artistName.toLowerCase()
  const search = query.toLowerCase()
  
  if (name === search) return 100
  if (name.startsWith(search)) return 90
  if (name.includes(search)) return 80
  
  // Check if all query words are in the artist name
  const queryWords = search.split(' ')
  const nameWords = name.split(' ')
  const matchingWords = queryWords.filter(word => 
    nameWords.some(nameWord => nameWord.includes(word))
  )
  
  return Math.max(50, (matchingWords.length / queryWords.length) * 70)
}

export async function POST(request: NextRequest) {
  return GET(request)
} 