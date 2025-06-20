import { createClient } from '@supabase/supabase-js'

// Use environment variables directly
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TICKETMASTER_API_KEY) {
  console.error('Missing env vars. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TICKETMASTER_API_KEY are set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface TicketmasterEvent {
  id: string
  name: string
  dates: any
  _embedded: any
  url: string
  score?: number
  priceRanges?: { min: number; max: number }[]
}

async function main() {
  console.log('🌱 Starting initial seed of TheSet database...')
  
  try {
    // Clear existing data (MVP: start fresh)
    console.log('🗑️ Clearing existing data...')
    await supabase.from('setlist_songs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('setlists').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('songs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('shows').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('artists').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('venues').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Fetch top US shows from Ticketmaster (first 200)
    console.log('🎫 Fetching top shows from Ticketmaster...')
    
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events?` +
      `apikey=${TICKETMASTER_API_KEY}` +
      `&countryCode=US` +
      `&classificationName=Music` +
      `&startDateTime=${startDate}T00:00:00Z` +
      `&endDateTime=${endDate}T23:59:59Z` +
      `&size=200` +
      `&page=0` +
      `&sort=relevance,desc`
    )
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`)
    }
    
    const data = await response.json()
    const events = data._embedded?.events || []
    
    console.log(`📊 Found ${events.length} events from Ticketmaster`)
    
    // Process events into venues, artists, and shows
    const venueRows = []
    const artistRows = []
    const showRows = []
    
    for (const event of events) {
      try {
        const attractions = event._embedded?.attractions
        if (!attractions?.length) continue
        
        const venueData = event._embedded?.venues?.[0]
        if (!venueData) continue
        
        const attraction = attractions[0]
        
        // Prepare venue
        venueRows.push({
          ticketmaster_id: venueData.id,
          name: venueData.name,
          city: venueData.city?.name,
          state: venueData.state?.stateCode,
          country: venueData.country?.countryCode || 'US',
          address: venueData.address?.line1,
          postal_code: venueData.postalCode,
          latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null,
          longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null,
        })
        
        // Prepare artist
        const genres = []
        if (attraction.classifications?.[0]?.genre?.name) {
          genres.push(attraction.classifications[0].genre.name)
        }
        
        artistRows.push({
          ticketmaster_id: attraction.id,
          name: attraction.name,
          slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          image_url: attraction.images?.find((img: any) => img.ratio === '16_9')?.url,
          genres: genres,
          popularity: Math.floor(Math.random() * 50) + 50,
          needs_spotify_sync: true
        })
        
        // Prepare show
        const showDate = event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`
        showRows.push({
          ticketmaster_id: event.id,
          title: event.name,
          date: showDate.split('T')[0],
          status: 'upcoming',
          ticketmaster_url: event.url,
          popularity: event.score || 50,
          _venue_tm_id: venueData.id,
          _artist_tm_id: attraction.id
        })
        
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        continue
      }
    }
    
    console.log(`📝 Prepared ${venueRows.length} venues, ${artistRows.length} artists, ${showRows.length} shows`)
    
    // Insert venues
    console.log('🏟️ Inserting venues...')
    const { data: insertedVenues, error: venueError } = await supabase
      .from('venues')
      .upsert(venueRows, { onConflict: 'ticketmaster_id' })
      .select('id, ticketmaster_id')
    
    if (venueError) throw venueError
    
    // Insert artists
    console.log('🎤 Inserting artists...')
    const { data: insertedArtists, error: artistError } = await supabase
      .from('artists')
      .upsert(artistRows, { onConflict: 'ticketmaster_id' })
      .select('id, ticketmaster_id')
    
    if (artistError) throw artistError
    
    // Create lookup maps
    const venueMap = new Map(insertedVenues?.map(v => [v.ticketmaster_id, v.id]) || [])
    const artistMap = new Map(insertedArtists?.map(a => [a.ticketmaster_id, a.id]) || [])
    
    // Resolve foreign keys and insert shows
    const finalShowRows = showRows
      .map(show => ({
        ticketmaster_id: show.ticketmaster_id,
        artist_id: artistMap.get(show._artist_tm_id),
        venue_id: venueMap.get(show._venue_tm_id),
        title: show.title,
        date: show.date,
        status: show.status,
        ticketmaster_url: show.ticketmaster_url,
        popularity: show.popularity
      }))
      .filter(show => show.artist_id && show.venue_id)
    
    console.log('🎭 Inserting shows...')
    const { data: insertedShows, error: showError } = await supabase
      .from('shows')
      .insert(finalShowRows)
      .select('id, artist_id')
    
    if (showError) throw showError
    
    console.log(`✅ Successfully seeded database:`)
    console.log(`   🏟️ ${insertedVenues?.length || 0} venues`)
    console.log(`   🎤 ${insertedArtists?.length || 0} artists`)
    console.log(`   🎭 ${insertedShows?.length || 0} shows`)
    
    console.log('\n🎵 Now run the Spotify sync to populate song catalogs!')
    console.log('💡 Then trigger the calculate-trending function to populate homepage data.')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
} 