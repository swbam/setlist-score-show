import { NextRequest, NextResponse } from 'next/server'
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
    // Get Spotify access token
    const token = await getSpotifyToken()
    
    // Fetch top artists from different playlists to get variety
    const playlistIds = [
      '37i9dQZF1DXcBWIGoYBM5M', // Today's Top Hits
      '37i9dQZF1DX0XUsuxWHRQd', // RapCaviar
      '37i9dQZF1DXcF6B6QPhFDv', // Rock This
      '37i9dQZF1DX1lVhptIYRda', // Hot Country
      '37i9dQZF1DWXRqgorJj26U', // Rock Classics
    ]
    
    const allArtists = new Map()
    
    for (const playlistId of playlistIds) {
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (!playlistResponse.ok) continue
      
      const playlistData = await playlistResponse.json()
      
      // Extract unique artists
      for (const item of playlistData.items) {
        const track = item.track
        if (!track) continue
        
        for (const artist of track.artists) {
          if (!allArtists.has(artist.id)) {
            allArtists.set(artist.id, artist)
          }
        }
      }
    }
    
    // Get full artist details for top artists
    const artistIds = Array.from(allArtists.keys()).slice(0, 50)
    const artistsResponse = await fetch(
      `https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    
    const { artists } = await artistsResponse.json()
    
    let importedCount = 0
    
    // Import each artist
    for (const artist of artists) {
      if (!artist) continue
      
      const { data, error } = await supabase.rpc('import_spotify_artist', {
        p_spotify_id: artist.id,
        p_name: artist.name,
        p_image_url: artist.images[0]?.url || null,
        p_genres: artist.genres || [],
        p_followers: artist.followers?.total || 0
      })
      
      if (!error && data) {
        importedCount++
        
        // Also fetch some top tracks
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        if (tracksResponse.ok) {
          const { tracks } = await tracksResponse.json()
          
          // Import top 10 songs
          for (const track of tracks.slice(0, 10)) {
            await supabase.from('songs').upsert({
              artist_id: data[0].id,
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
    
    // Update sync state
    await supabase.from('sync_state').upsert({
      job_name: 'import_top_artists',
      last_sync_date: new Date().toISOString(),
      records_processed: artists.length,
      records_created: importedCount,
      status: 'completed'
    })
    
    return NextResponse.json({ 
      success: true, 
      count: importedCount,
      message: `Imported ${importedCount} artists successfully` 
    })
  } catch (error: any) {
    console.error('Import artists error:', error)
    
    await supabase.from('sync_state').upsert({
      job_name: 'import_top_artists',
      last_sync_date: new Date().toISOString(),
      status: 'failed',
      error_message: error.message
    })
    
    return NextResponse.json(
      { error: error.message || 'Failed to import artists' },
      { status: 500 }
    )
  }
} 