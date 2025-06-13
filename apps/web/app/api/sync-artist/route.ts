import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { artistId } = await request.json()
    
    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the artist
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single()
    
    if (artistError || !artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
    }

    // Sync data from Ticketmaster
    if (artist.ticketmaster_id) {
      const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${artist.ticketmaster_id}&apikey=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b&size=20&countryCode=US`
      
      const tmResponse = await fetch(tmUrl)
      const tmData = await tmResponse.json()
      
      if (tmData._embedded?.events) {
        for (const event of tmData._embedded.events) {
          // Create or update venue
          let venueId = null
          if (event._embedded?.venues?.[0]) {
            const venue = event._embedded.venues[0]
            
            const { data: existingVenue } = await supabase
              .from('venues')
              .select('id')
              .eq('ticketmaster_id', venue.id)
              .single()
            
            if (existingVenue) {
              venueId = existingVenue.id
            } else {
              const { data: newVenue } = await supabase
                .from('venues')
                .insert({
                  name: venue.name,
                  city: venue.city?.name || 'Unknown',
                  state: venue.state?.stateCode || venue.state?.name || '',
                  country: venue.country?.countryCode || 'US',
                  ticketmaster_id: venue.id,
                  capacity: venue.boxOfficeInfo?.openHoursDetail || 0
                })
                .select()
                .single()
              
              venueId = newVenue?.id
            }
          }
          
          // Create show
          if (venueId) {
            const showDate = new Date(event.dates.start.dateTime || event.dates.start.localDate)
            
            const { data: existingShow } = await supabase
              .from('shows')
              .select('id')
              .eq('artist_id', artistId)
              .eq('venue_id', venueId)
              .eq('date', showDate.toISOString())
              .single()
            
            if (!existingShow) {
              const { data: show } = await supabase
                .from('shows')
                .insert({
                  artist_id: artistId,
                  venue_id: venueId,
                  date: showDate.toISOString(),
                  title: event.name,
                  status: 'upcoming',
                  ticketmaster_url: event.url,
                  view_count: 0
                })
                .select()
                .single()
              
              // Create a default setlist
              if (show) {
                await supabase
                  .from('setlists')
                  .insert({
                    show_id: show.id,
                    name: 'Main Set',
                    order_index: 0
                  })
              }
            }
          }
        }
      }
    }

    // Sync songs from Spotify
    if (artist.spotify_id) {
      // Get Spotify access token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID || ''}:${process.env.SPOTIFY_CLIENT_SECRET || ''}`
          ).toString('base64')
        },
        body: 'grant_type=client_credentials'
      })
      
      const { access_token } = await tokenResponse.json()
      
      // Get top tracks
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artist.spotify_id}/top-tracks?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      )
      
      const tracksData = await tracksResponse.json()
      
      if (tracksData.tracks) {
        for (const track of tracksData.tracks) {
          const { data: existingSong } = await supabase
            .from('songs')
            .select('id')
            .eq('spotify_id', track.id)
            .single()
          
          if (!existingSong) {
            await supabase
              .from('songs')
              .insert({
                artist_id: artistId,
                title: track.name,
                album: track.album.name,
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                spotify_id: track.id,
                preview_url: track.preview_url
              })
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Artist data synced successfully' 
    })
    
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}