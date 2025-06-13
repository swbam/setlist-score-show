import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || ''
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ''
const TICKETMASTER_API_KEY = 'k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b'

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

async function searchSpotifyArtist(artistName: string, token: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  
  const data = await response.json()
  return data.artists?.items?.[0]
}

async function getSpotifyArtistTopTracks(spotifyId: string, token: string) {
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${spotifyId}/top-tracks?market=US`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  
  const data = await response.json()
  return data.tracks || []
}

async function getTicketmasterShows(ticketmasterId: string) {
  const response = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${ticketmasterId}&apikey=${TICKETMASTER_API_KEY}&size=50&sort=date,asc&classificationName=music`,
    {
      headers: {
        'Accept': 'application/json'
      }
    }
  )
  
  if (!response.ok) {
    console.error('Ticketmaster API error:', response.status)
    return []
  }
  
  const data = await response.json()
  return data._embedded?.events || []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketmasterId, name, imageUrl, slug } = body
    
    console.log('Importing artist:', name)
    
    // 1. Check if artist already exists
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('id, slug')
      .eq('ticketmaster_id', ticketmasterId)
      .single()
    
    if (existingArtist) {
      return NextResponse.json({ artist: existingArtist })
    }
    
    // 2. Get Spotify token and search for artist
    const spotifyToken = await getSpotifyToken()
    const spotifyArtist = await searchSpotifyArtist(name, spotifyToken)
    
    // 3. Try to get Setlist.fm MBID
    let setlistfmMbid = null
    try {
      const setlistFmApiKey = process.env.SETLIST_FM_API_KEY
      if (setlistFmApiKey) {
        const setlistResponse = await fetch(
          `https://api.setlist.fm/rest/1.0/search/artists?artistName=${encodeURIComponent(name)}&sort=relevance`,
          {
            headers: {
              'Accept': 'application/json',
              'x-api-key': setlistFmApiKey
            }
          }
        )
        
        if (setlistResponse.ok) {
          const setlistData = await setlistResponse.json()
          if (setlistData.artist && setlistData.artist.length > 0) {
            // Find best match
            const bestMatch = setlistData.artist.find((sf: any) => 
              sf.name.toLowerCase() === name.toLowerCase()
            ) || setlistData.artist[0]
            setlistfmMbid = bestMatch.mbid
            console.log(`✅ Found Setlist.fm MBID for ${name}: ${setlistfmMbid}`)
          }
        }
      }
    } catch (sfError) {
      console.log(`⚠️ Could not find Setlist.fm MBID for ${name}:`, sfError)
    }
    
    // 4. Create artist in database
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .insert({
        name,
        slug,
        image_url: imageUrl || spotifyArtist?.images?.[0]?.url,
        ticketmaster_id: ticketmasterId,
        spotify_id: spotifyArtist?.id,
        setlistfm_mbid: setlistfmMbid,
        genres: spotifyArtist?.genres || [],
        popularity: spotifyArtist?.popularity || 0,
        followers: spotifyArtist?.followers?.total || 0
      })
      .select()
      .single()
    
    if (artistError) {
      console.error('Error creating artist:', artistError)
      throw artistError
    }
    
    // 5. Import top songs from Spotify
    if (spotifyArtist?.id) {
      const topTracks = await getSpotifyArtistTopTracks(spotifyArtist.id, spotifyToken)
      
      // Insert songs
      const songsToInsert = topTracks.map((track: any) => ({
        artist_id: artist.id,
        title: track.name,
        album: track.album.name,
        album_image_url: track.album.images?.[0]?.url,
        duration_ms: track.duration_ms,
        spotify_id: track.id,
        spotify_url: track.external_urls.spotify,
        popularity: track.popularity,
        preview_url: track.preview_url
      }))
      
      if (songsToInsert.length > 0) {
        const { error: songsError } = await supabase
          .from('songs')
          .insert(songsToInsert)
        
        if (songsError) {
          console.error('Error inserting songs:', songsError)
        }
      }
    }
    
    // 6. Fetch upcoming shows from Ticketmaster
    const tmShows = await getTicketmasterShows(ticketmasterId)
    console.log(`Found ${tmShows.length} shows from Ticketmaster`)
    
    // 7. Process each show
    for (const tmShow of tmShows) {
      try {
        // Create venue if it doesn't exist
        const venueName = tmShow._embedded?.venues?.[0]?.name || 'Unknown Venue'
        const venueCity = tmShow._embedded?.venues?.[0]?.city?.name || ''
        const venueState = tmShow._embedded?.venues?.[0]?.state?.stateCode || ''
        const venueCountry = tmShow._embedded?.venues?.[0]?.country?.countryCode || ''
        const venueTicketmasterId = tmShow._embedded?.venues?.[0]?.id
        
        let venue
        if (venueTicketmasterId) {
          // Check if venue exists
          const { data: existingVenue } = await supabase
            .from('venues')
            .select('id')
            .eq('ticketmaster_id', venueTicketmasterId)
            .single()
          
          if (existingVenue) {
            venue = existingVenue
          } else {
            // Create venue
            const { data: newVenue, error: venueError } = await supabase
              .from('venues')
              .insert({
                name: venueName,
                city: venueCity,
                state: venueState,
                country: venueCountry,
                ticketmaster_id: venueTicketmasterId,
                latitude: tmShow._embedded?.venues?.[0]?.location?.latitude,
                longitude: tmShow._embedded?.venues?.[0]?.location?.longitude,
                capacity: null
              })
              .select()
              .single()
            
            if (venueError) {
              console.error('Error creating venue:', venueError)
              continue
            }
            
            venue = newVenue
          }
        }
        
        // Create show
        const showDate = new Date(tmShow.dates.start.dateTime || tmShow.dates.start.localDate)
        const { data: show, error: showError } = await supabase
          .from('shows')
          .insert({
            artist_id: artist.id,
            venue_id: venue?.id,
            date: showDate.toISOString(),
            title: `${artist.name} at ${venueName}`,
            status: 'upcoming',
            ticketmaster_id: tmShow.id,
            ticketmaster_url: tmShow.url,
            view_count: 0
          })
          .select()
          .single()
        
        if (showError) {
          console.error('Error creating show:', showError)
          continue
        }
        
        // Create default setlist for the show
        const { data: setlist, error: setlistError } = await supabase
          .from('setlists')
          .insert({
            show_id: show.id,
            name: 'Main Set',
            order_index: 0
          })
          .select()
          .single()
        
        if (setlistError) {
          console.error('Error creating setlist:', setlistError)
          continue
        }
        
        // Add songs to setlist (if we have them)
        const { data: artistSongs } = await supabase
          .from('songs')
          .select('id')
          .eq('artist_id', artist.id)
          .order('popularity', { ascending: false })
          .limit(15) // Add top 15 songs to setlist
        
        if (artistSongs && artistSongs.length > 0) {
          const setlistSongs = artistSongs.map((song, index) => ({
            setlist_id: setlist.id,
            song_id: song.id,
            position: index + 1,
            vote_count: 0
          }))
          
          const { error: setlistSongsError } = await supabase
            .from('setlist_songs')
            .insert(setlistSongs)
          
          if (setlistSongsError) {
            console.error('Error adding songs to setlist:', setlistSongsError)
          }
        }
      } catch (showError) {
        console.error('Error processing show:', showError)
      }
    }
    
    // 8. TODO: Fetch past setlists from Setlist.fm (requires API key)
    
    return NextResponse.json({ 
      artist,
      message: `Successfully imported ${name} with ${tmShows.length} shows`
    })
    
  } catch (error) {
    console.error('Import artist error:', error)
    return NextResponse.json(
      { error: 'Failed to import artist' },
      { status: 500 }
    )
  }
}