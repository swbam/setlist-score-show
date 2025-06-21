import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY')!
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get artists that need shows (popular artists with 0 shows)
    const { data: artistsNeedingShows } = await supabase
      .from('artists')
      .select('id, name, spotify_id')
      .filter('popularity', 'gte', 70) // Only popular artists
      .order('popularity', { ascending: false })
      .limit(20)

    console.log(`Found ${artistsNeedingShows?.length || 0} artists to search for`)

    let totalNewShows = 0
    let totalNewVenues = 0

    for (const artist of artistsNeedingShows || []) {
      try {
        // Search for this specific artist on Ticketmaster
        console.log(`Searching for shows by: ${artist.name}`)
        
        const searchQuery = encodeURIComponent(artist.name)
        const startDate = new Date().toISOString().split('T')[0]
        const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next year
        
        const response = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events?` +
          `apikey=${TICKETMASTER_API_KEY}` +
          `&keyword=${searchQuery}` +
          `&countryCode=US` +
          `&classificationName=Music` +
          `&startDateTime=${startDate}T00:00:00Z` +
          `&endDateTime=${endDate}T23:59:59Z` +
          `&size=50` +
          `&sort=date,asc`
        )

        if (!response.ok) {
          console.error(`Ticketmaster API error for ${artist.name}:`, response.status)
          continue
        }

        const data = await response.json()
        const events = data._embedded?.events || []
        
        console.log(`Found ${events.length} events for ${artist.name}`)

        for (const event of events) {
          try {
            // Check if this artist is actually in the event
            const attractions = event._embedded?.attractions || []
            const matchingAttraction = attractions.find(attr => 
              attr.name.toLowerCase().includes(artist.name.toLowerCase()) ||
              artist.name.toLowerCase().includes(attr.name.toLowerCase())
            )

            if (!matchingAttraction) {
              console.log(`Skipping event - artist name mismatch: ${event.name}`)
              continue
            }

            // Process venue
            const venueData = event._embedded?.venues?.[0]
            if (!venueData) continue

            let venueId
            const { data: existingVenue } = await supabase
              .from('venues')
              .select('id')
              .eq('ticketmaster_id', venueData.id)
              .single()

            if (existingVenue) {
              venueId = existingVenue.id
            } else {
              const { data: newVenue, error: venueError } = await supabase
                .from('venues')
                .insert({
                  ticketmaster_id: venueData.id,
                  name: venueData.name,
                  city: venueData.city?.name,
                  state: venueData.state?.stateCode,
                  country: venueData.country?.countryCode || 'US',
                  address: venueData.address?.line1,
                  capacity: venueData.generalInfo?.generalRule?.match(/\d+/)?.[0] ? 
                    parseInt(venueData.generalInfo.generalRule.match(/\d+/)[0]) : null,
                  postal_code: venueData.postalCode,
                  longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null,
                  latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null
                })
                .select('id')
                .single()

              if (venueError) {
                console.error('Error creating venue:', venueError)
                continue
              }

              venueId = newVenue.id
              totalNewVenues++
            }

            // Check if show already exists
            const { data: existingShow } = await supabase
              .from('shows')
              .select('id')
              .eq('ticketmaster_id', event.id)
              .single()

            if (!existingShow) {
              const showDate = event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`
              
              const { data: newShow, error: showError } = await supabase
                .from('shows')
                .insert({
                  ticketmaster_id: event.id,
                  artist_id: artist.id,
                  venue_id: venueId,
                  title: event.name,
                  date: showDate,
                  status: 'upcoming',
                  tickets_url: event.url,
                  min_price: event.priceRanges?.[0]?.min,
                  max_price: event.priceRanges?.[0]?.max,
                  popularity: event.score || 50,
                  sales_status: event.dates.status.code,
                  presale_date: event.sales?.presales?.[0]?.startDateTime,
                  onsale_date: event.sales?.public?.startDateTime
                })
                .select('id')
                .single()

              if (showError) {
                console.error('Error creating show:', showError)
                continue
              }

              totalNewShows++
              console.log(`Created show: ${event.name} for ${artist.name}`)

              // Create initial setlist
              try {
                await supabase.rpc('create_initial_setlist', { 
                  p_show_id: newShow.id,
                  p_artist_id: artist.id 
                })
              } catch (error) {
                console.error('Error creating initial setlist:', error)
              }
            }
          } catch (error) {
            console.error('Error processing event:', error)
            continue
          }
        }

        // Small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error searching for artist ${artist.name}:`, error)
        continue
      }
    }

    console.log(`Artist sync complete: ${totalNewShows} new shows, ${totalNewVenues} new venues`)

    return new Response(JSON.stringify({ 
      success: true,
      new_shows: totalNewShows,
      new_venues: totalNewVenues,
      artists_searched: artistsNeedingShows?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error) {
    console.error('Artist sync error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
}) 