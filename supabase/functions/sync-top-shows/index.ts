import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    console.log('Starting top shows sync...')
    
    // Fetch top 50 shows from Ticketmaster
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events?` +
      `apikey=${TICKETMASTER_API_KEY}` +
      `&countryCode=US` +
      `&classificationName=Music` +
      `&startDateTime=${startDate}T00:00:00Z` +
      `&endDateTime=${endDate}T23:59:59Z` +
      `&size=50` +
      `&sort=relevance,desc` +
      `&includeTBA=no` +
      `&includeTBD=no`
    )
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`)
    }
    
    const data = await response.json()
    const events = data._embedded?.events || []
    
    console.log(`Found ${events.length} events from Ticketmaster`)
    
    let processed = 0
    let created = 0
    
    for (const event of events) {
      try {
        // Skip if no artist info
        const attractions = event._embedded?.attractions
        if (!attractions?.length) continue
        
        // Process venue first
        const venueData = event._embedded?.venues?.[0]
        if (!venueData) continue
        
        let venueId: string | null = null
        
        // Check if venue exists
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id')
          .eq('ticketmaster_id', venueData.id)
          .single()
        
        if (existingVenue) {
          venueId = existingVenue.id
        } else {
          // Create new venue
          const { data: newVenue, error: venueError } = await supabase
            .from('venues')
            .insert({
              ticketmaster_id: venueData.id,
              name: venueData.name,
              city: venueData.city?.name,
              state: venueData.state?.stateCode,
              country: venueData.country?.countryCode,
              address: venueData.address?.line1,
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
        
        // Process artist
        const attraction = attractions[0]
        let artistId: string | null = null
        
        const { data: existingArtist } = await supabase
          .from('artists')
          .select('id')
          .eq('ticketmaster_id', attraction.id)
          .single()
        
        if (existingArtist) {
          artistId = existingArtist.id
        } else {
          // Create artist with better metadata
          const { data: newArtist, error: artistError } = await supabase
            .from('artists')
            .insert({
              ticketmaster_id: attraction.id,
              name: attraction.name,
              slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              image_url: attraction.images?.find((img: any) => img.ratio === '16_9')?.url,
              genres: attraction.classifications?.[0]?.genre?.name ? 
                [attraction.classifications[0].genre.name] : [],
              popularity: Math.floor(Math.random() * 50) + 50
            })
            .select('id')
            .single()
          
          if (artistError) {
            console.error('Artist creation error:', artistError)
            continue
          }
          
          artistId = newArtist.id
        }
        
        // Check if show already exists
        const { data: existingShow } = await supabase
          .from('shows')
          .select('id')
          .eq('ticketmaster_id', event.id)
          .single()
        
        if (!existingShow) {
          // Create new show
          const { data: newShow, error: showError } = await supabase
            .from('shows')
            .insert({
              ticketmaster_id: event.id,
              artist_id: artistId,
              venue_id: venueId,
              title: event.name,
              date: event.dates.start.dateTime ? 
                event.dates.start.dateTime.split('T')[0] : 
                event.dates.start.localDate,
              status: 'upcoming',
              ticketmaster_url: event.url,
              min_price: event.priceRanges?.[0]?.min,
              max_price: event.priceRanges?.[0]?.max
            })
            .select('id')
            .single()
          
          if (showError) {
            console.error('Show creation error:', showError)
            continue
          }
          
          // Create initial setlist
          await createInitialSetlist(supabase, newShow.id, artistId)
          
          created++
        }
        
        processed++
        
        // Rate limiting
        if (processed % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        continue
      }
    }
    
    // Refresh homepage cache
    const { error: cacheError } = await supabase.rpc('refresh_homepage_cache')
    if (cacheError) {
      console.error('Cache refresh error:', cacheError)
    }
    
    console.log(`Sync completed: ${processed} processed, ${created} created`)
    
    return new Response(JSON.stringify({ 
      success: true,
      processed,
      created,
      message: `Processed ${processed} events, created ${created} new shows`
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Sync error:', error)
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
    // Get songs from artist's catalog
    const { data: songs } = await supabase
      .from('songs')
      .select('id, title, popularity')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(10)
    
    if (songs && songs.length > 0) {
      // Create setlist
      const { data: setlist } = await supabase
        .from('setlists')
        .insert({
          show_id: showId,
          name: 'Main Set',
          order_index: 0
        })
        .select('id')
        .single()
      
      if (setlist) {
        // Add up to 5 songs to setlist
        const selectedSongs = songs.slice(0, Math.min(5, songs.length))
        
        for (let i = 0; i < selectedSongs.length; i++) {
          await supabase
            .from('setlist_songs')
            .insert({
              setlist_id: setlist.id,
              song_id: selectedSongs[i].id,
              position: i + 1,
              vote_count: 0
            })
        }
      }
    }
  } catch (error) {
    console.error('Error creating initial setlist:', error)
  }
}
