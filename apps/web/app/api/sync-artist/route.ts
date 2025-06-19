import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  return data.access_token
}

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
      const token = await getSpotifyToken()
      
      // Fetch artist from Spotify
      const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.spotify_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!artistResponse.ok) {
        return NextResponse.json({ error: 'Artist not found on Spotify' }, { status: 404 })
      }
      
      const spotifyArtist = await artistResponse.json()
      
      // Import artist using the database function
      const { data: importedArtist, error } = await supabase.rpc('import_spotify_artist', {
        p_spotify_id: spotifyArtist.id,
        p_name: spotifyArtist.name,
        p_image_url: spotifyArtist.images[0]?.url || null,
        p_genres: spotifyArtist.genres || [],
        p_followers: spotifyArtist.followers?.total || 0
      })
      
      if (error) {
        console.error('Error importing artist:', error)
        return NextResponse.json({ error: 'Failed to import artist' }, { status: 500 })
      }
      
      // If artist is imported successfully, link it to the user
      if (importedArtist?.[0]) {
        await supabase.from('user_artists').upsert({
          user_id: artist.user_id,
          artist_id: importedArtist[0].id,
          source: 'spotify_import'
        })
      }
      
      // Import artist's top tracks
      if (importedArtist?.[0]) {
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.spotify_id}/top-tracks?market=US`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        
        if (tracksResponse.ok) {
          const { tracks } = await tracksResponse.json()
          
          // Import songs
          for (const track of tracks.slice(0, 20)) {
            await supabase.from('songs').upsert({
              artist_id: importedArtist[0].id,
              spotify_id: track.id,
              title: track.name,
              album: track.album.name,
              album_image_url: track.album.images[0]?.url,
              duration_ms: track.duration_ms,
              popularity: track.popularity,
              preview_url: track.preview_url,
              spotify_url: track.external_urls.spotify
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