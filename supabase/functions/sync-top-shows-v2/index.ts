import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    console.log('Starting enhanced top shows sync...')
    
    // Get sync cursor from last run
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('job_name', 'ticketmaster_shows')
      .single()
    
    const lastSyncDate = syncState?.last_sync_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Fetch shows in sliding window (next 90 days)
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    let page = 0
    let hasMore = true
    const allShows = []
    const maxPages = 10 // Max 10 pages = 2000 shows (200 per page)
    
    while (hasMore && page < maxPages) {
      console.log(`Fetching page ${page + 1}...`)
      
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?` +
        `apikey=${TICKETMASTER_API_KEY}` +
        `&countryCode=US` +
        `&classificationName=Music` +
        `&startDateTime=${startDate}T00:00:00Z` +
        `&endDateTime=${endDate}T23:59:59Z` +
        `&size=200` + // Max page size
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
      
      // Check if there are more pages
      hasMore = data.page && data.page.number < data.page.totalPages - 1
      page++
      
      // Rate limiting between pages
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log(`Found ${allShows.length} total events from Ticketmaster`)
    
    // Process shows with proper deduplication
    const processedShows = []
    const venueMap = new Map()
    const artistMap = new Map()
    
    for (const event of allShows) {
      try {
        // Skip if no artist info
        const attractions = event._embedded?.attractions
        if (!attractions?.length) continue
        
        // Process venue first
        const venueData = event._embedded?.venues?.[0]
        if (!venueData) continue
        
        let venueId = venueMap.get(venueData.id)
        if (!venueId) {
          // Check if venue exists by ticketmaster_id
          const { data: existingVenue } = await supabase
            .from('venues')
            .select('id')
            .eq('ticketmaster_id', venueData.id)
            .single()
          
          if (existingVenue) {
            venueId = existingVenue.id
          } else {
            // Create new venue with PostGIS point
            const locationPoint = venueData.location 
              ? `POINT(${venueData.location.longitude} ${venueData.location.latitude})`
              : null
            
            const { data: newVenue, error: venueError } = await supabase
              .from('venues')
              .insert({
                ticketmaster_id: venueData.id,
                name: venueData.name,
                city: venueData.city?.name,
                state: venueData.state?.stateCode,
                country: venueData.country?.countryCode,
                address: venueData.address?.line1,
                capacity: parseInt(venueData.generalInfo?.generalRule?.match(/\d+/)?.[0]) || null,
                location: locationPoint,
                postal_code: venueData.postalCode,
                latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null,
                longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null
              })
              .select('id')
              .single()
            
            if (venueError) {
              console.error('Venue creation error:', venueError)
              continue
            }
            
            venueId = newVenue.id
          }
          venueMap.set(venueData.id, venueId)
        }
        
        // Process artist
        const attraction = attractions[0]
        let artistId = artistMap.get(attraction.id)
        
        if (!artistId) {
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id')
            .eq('ticketmaster_id', attraction.id)
            .single()
          
          if (existingArtist) {
            artistId = existingArtist.id
          } else {
            // Create artist with better metadata
            const genres = []
            if (attraction.classifications?.[0]?.genre?.name) {
              genres.push(attraction.classifications[0].genre.name)
            }
            if (attraction.classifications?.[0]?.subGenre?.name) {
              genres.push(attraction.classifications[0].subGenre.name)
            }
            
            const { data: newArtist, error: artistError } = await supabase
              .from('artists')
              .insert({
                ticketmaster_id: attraction.id,
                name: attraction.name,
                slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                image_url: attraction.images?.find((img: any) => img.ratio === '16_9')?.url,
                genres: genres,
                popularity: Math.floor(Math.random() * 50) + 50, // Temporary until Spotify sync
                needs_spotify_sync: true
              })
              .select('id')
              .single()
            
            if (artistError) {
              console.error('Artist creation error:', artistError)
              continue
            }
            
            artistId = newArtist.id
          }
          artistMap.set(attraction.id, artistId)
        }
        
        // Check if show already exists
        const { data: existingShow } = await supabase
          .from('shows')
          .select('id')
          .eq('ticketmaster_id', event.id)
          .single()
        
        if (!existingShow) {
          const showDate = event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`
          
          processedShows.push({
            ticketmaster_id: event.id,
            artist_id: artistId,
            venue_id: venueId,
            title: event.name,
            date: showDate.split('T')[0],
            status: 'upcoming',
            ticketmaster_url: event.url,
            tickets_url: event.url,
            min_price: event.priceRanges?.[0]?.min,
            max_price: event.priceRanges?.[0]?.max,
            popularity: event.score || 50,
            sales_status: event.dates?.status?.code,
            presale_date: event.sales?.presales?.[0]?.startDateTime,
            onsale_date: event.sales?.public?.startDateTime
          })
        }
        
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        continue
      }
    }
    
    console.log(`Prepared ${processedShows.length} new shows for insertion`)
    
    // Bulk insert new shows in batches
    const batchSize = 50
    let totalCreated = 0
    
    for (let i = 0; i < processedShows.length; i += batchSize) {
      const batch = processedShows.slice(i, i + batchSize)
      
      const { data: insertedShows, error: insertError } = await supabase
        .from('shows')
        .insert(batch)
        .select('id, artist_id')
      
      if (insertError) {
        console.error('Batch insert error:', insertError)
        continue
      }
      
      if (insertedShows) {
        totalCreated += insertedShows.length
        
        // Create initial setlists for new shows
        for (const show of insertedShows) {
          await createInitialSetlist(supabase, show.id, show.artist_id)
        }
      }
      
      // Rate limiting between batches
      if (i + batchSize < processedShows.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Update sync state
    const { error: syncStateError } = await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows',
        last_sync_date: new Date().toISOString(),
        records_processed: allShows.length,
        records_created: totalCreated,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
    
    if (syncStateError) {
      console.error('Sync state update error:', syncStateError)
    }
    
    // Trigger homepage cache refresh
    const { error: cacheError } = await supabase.rpc('refresh_homepage_cache')
    if (cacheError) {
      console.error('Cache refresh error:', cacheError)
    }
    
    console.log(`Sync completed: ${allShows.length} processed, ${totalCreated} created`)
    
    return new Response(JSON.stringify({ 
      success: true,
      processed: allShows.length,
      created: totalCreated,
      pages_fetched: page,
      message: `Processed ${allShows.length} events, created ${totalCreated} new shows`
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Sync error:', error)
    
    // Update sync state with error
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows',
        status: 'error',
        error_message: error.message,
        updated_at: new Date().toISOString()
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
    // First check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single()
    
    if (existingSetlist) {
      return // Setlist already exists
    }
    
    // Get songs from artist's catalog
    const { data: songs } = await supabase
      .from('songs')
      .select('id, title, popularity')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(10)
    
    if (songs && songs.length > 0) {
      // Create setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .insert({
          show_id: showId,
          name: 'Main Set',
          order_index: 0
        })
        .select('id')
        .single()
      
      if (setlistError) {
        console.error('Setlist creation error:', setlistError)
        return
      }
      
      if (setlist) {
        // Add up to 5 songs to setlist
        const selectedSongs = songs.slice(0, Math.min(5, songs.length))
        const setlistSongs = selectedSongs.map((song, index) => ({
          setlist_id: setlist.id,
          song_id: song.id,
          position: index + 1,
          vote_count: 0
        }))
        
        const { error: songsError } = await supabase
          .from('setlist_songs')
          .insert(setlistSongs)
        
        if (songsError) {
          console.error('Setlist songs creation error:', songsError)
        }
      }
    } else {
      console.log(`No songs found for artist ${artistId}, skipping setlist creation`)
    }
  } catch (error) {
    console.error('Error creating initial setlist:', error)
  }
}