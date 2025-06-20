import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    console.log('Starting MVP top shows sync...')
    
    // Log sync start
    const { data: syncRecord } = await supabase
      .from('sync_history')
      .insert({
        sync_type: 'ticketmaster',
        entity_type: 'shows',
        status: 'started'
      })
      .select('id')
      .single()
    
    const syncId = syncRecord?.id
    
    // Fetch shows (MVP: max 3 pages = 600 shows)
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    let page = 0
    let hasMore = true
    const allShows = []
    const maxPages = 3 // MVP limit
    
    while (hasMore && page < maxPages) {
      console.log(`Fetching page ${page + 1}...`)
      
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?` +
        `apikey=${TICKETMASTER_API_KEY}` +
        `&countryCode=US` +
        `&classificationName=Music` +
        `&startDateTime=${startDate}T00:00:00Z` +
        `&endDateTime=${endDate}T23:59:59Z` +
        `&size=200` +
        `&page=${page}` +
        `&sort=relevance,desc` +
        `&includeTBA=no` +
        `&includeTBD=no`
      )
      
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data._embedded?.events) {
        allShows.push(...data._embedded.events)
      }
      
      hasMore = data.page && data.page.number < data.page.totalPages - 1
      page++
      
      // Rate limiting between pages
      if (hasMore && page < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`Found ${allShows.length} total events from Ticketmaster`)
    
    // Process shows with deduplication using INSERT ... ON CONFLICT
    const venueRows = []
    const artistRows = []
    const showRows = []
    
    for (const event of allShows) {
      try {
        const attractions = event._embedded?.attractions
        if (!attractions?.length) continue
        
        const venueData = event._embedded?.venues?.[0]
        if (!venueData) continue
        
        const attraction = attractions[0]
        
        // Prepare venue row
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
        
        // Prepare artist row
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
        
        // Prepare show row
        const showDate = event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`
        showRows.push({
          ticketmaster_id: event.id,
          title: event.name,
          date: showDate.split('T')[0],
          status: 'upcoming',
          ticketmaster_url: event.url,
          popularity: event.score || 50,
          // We'll need to resolve artist_id and venue_id after upserts
          _venue_tm_id: venueData.id,
          _artist_tm_id: attraction.id
        })
        
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        continue
      }
    }
    
    console.log(`Prepared ${venueRows.length} venues, ${artistRows.length} artists, ${showRows.length} shows`)
    
    // Bulk upsert venues
    const { data: upsertedVenues } = await supabase
      .from('venues')
      .upsert(venueRows, { onConflict: 'ticketmaster_id' })
      .select('id, ticketmaster_id')
    
    // Bulk upsert artists
    const { data: upsertedArtists } = await supabase
      .from('artists')
      .upsert(artistRows, { onConflict: 'ticketmaster_id' })
      .select('id, ticketmaster_id')
    
    // Create lookup maps
    const venueMap = new Map(upsertedVenues?.map(v => [v.ticketmaster_id, v.id]) || [])
    const artistMap = new Map(upsertedArtists?.map(a => [a.ticketmaster_id, a.id]) || [])
    
    // Resolve foreign keys in show rows
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
      .filter(show => show.artist_id && show.venue_id) // Only keep shows with valid FKs
    
    // Bulk upsert shows
    const { data: insertedShows } = await supabase
      .from('shows')
      .upsert(finalShowRows, { onConflict: 'ticketmaster_id' })
      .select('id, artist_id, created_at')
    
    // Create initial setlists for newly created shows (those created in last hour)
    const newShows = insertedShows?.filter(s => 
      new Date(s.created_at) > new Date(Date.now() - 60 * 60 * 1000)
    ) || []
    
    console.log(`Creating setlists for ${newShows.length} new shows`)
    
    for (const show of newShows) {
      await createInitialSetlist(supabase, show.id, show.artist_id)
    }
    
    // Update sync history
    if (syncId) {
      await supabase
        .from('sync_history')
        .update({
          status: 'completed',
          items_processed: allShows.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', syncId)
    }
    
    console.log(`Sync completed: ${allShows.length} processed, ${newShows.length} new shows`)
    
    return new Response(JSON.stringify({ 
      success: true,
      processed: allShows.length,
      new_shows: newShows.length,
      pages_fetched: page
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    
    // Log error to sync history
    await supabase
      .from('sync_history')
      .insert({
        sync_type: 'ticketmaster',
        entity_type: 'shows',
        status: 'failed',
        error_message: error.message
      })
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function createInitialSetlist(supabase: any, showId: string, artistId: string) {
  try {
    // Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single()
    
    if (existingSetlist) return
    
    // Get songs from artist's catalog (fallback to empty if none)
    const { data: songs } = await supabase
      .from('songs')
      .select('id, title, popularity')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(10)
    
    // Create setlist regardless of whether we have songs
    const { data: setlist } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        name: 'Main Set',
        order_index: 0
      })
      .select('id')
      .single()
    
    if (setlist && songs?.length > 0) {
      // Add up to 5 songs to setlist
      const selectedSongs = songs.slice(0, Math.min(5, songs.length))
      const setlistSongs = selectedSongs.map((song, index) => ({
        setlist_id: setlist.id,
        song_id: song.id,
        position: index + 1,
        vote_count: 0
      }))
      
      await supabase
        .from('setlist_songs')
        .insert(setlistSongs)
    }
    
  } catch (error) {
    console.error('Error creating initial setlist:', error)
  }
}
