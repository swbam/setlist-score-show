import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SPOTIFY_CLIENT_ID = Deno.env.get('SPOTIFY_CLIENT_ID')!
const SPOTIFY_CLIENT_SECRET = Deno.env.get('SPOTIFY_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SpotifyAccessTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyArtist {
  id: string
  name: string
  images: Array<{ url: string; height: number; width: number }>
  genres: string[]
  popularity: number
  followers: { total: number }
  external_urls: { spotify: string }
}

interface SpotifyTrack {
  id: string
  name: string
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    release_date: string
  }
  duration_ms: number
  popularity: number
  preview_url: string | null
  external_urls: { spotify: string }
}

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    console.log('Starting enhanced Spotify sync...')
    
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Spotify access token: ${tokenResponse.status}`)
    }
    
    const tokenData: SpotifyAccessTokenResponse = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    // Update sync state to running
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'spotify_enhanced_sync',
        status: 'running',
        updated_at: new Date().toISOString()
      })
    
    // Get artists that need Spotify sync
    const { data: artistsToSync, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, spotify_id, ticketmaster_id')
      .or('needs_spotify_sync.eq.true,spotify_id.is.null')
      .limit(50) // Process in batches to avoid timeouts
    
    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`)
    }
    
    console.log(`Found ${artistsToSync?.length || 0} artists to sync`)
    
    let processedCount = 0
    let updatedCount = 0
    let errorCount = 0
    
    if (artistsToSync) {
      for (const artist of artistsToSync) {
        try {
          let spotifyData: SpotifyArtist | null = null
          
          // Search for artist on Spotify if no spotify_id
          if (!artist.spotify_id) {
            const searchQuery = encodeURIComponent(artist.name)
            const searchResponse = await fetch(
              `https://api.spotify.com/v1/search?q=${searchQuery}&type=artist&limit=1`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            )
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              if (searchData.artists?.items?.length > 0) {
                spotifyData = searchData.artists.items[0]
              }
            }
          } else {
            // Get artist details if we have spotify_id
            const artistResponse = await fetch(
              `https://api.spotify.com/v1/artists/${artist.spotify_id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              }
            )
            
            if (artistResponse.ok) {
              spotifyData = await artistResponse.json()
            }
          }
          
          if (spotifyData) {
            // Update artist with Spotify data
            const updateData = {
              spotify_id: spotifyData.id,
              image_url: spotifyData.images?.[0]?.url || null,
              genres: spotifyData.genres || [],
              popularity: Math.min(spotifyData.popularity || 0, 100),
              followers: spotifyData.followers?.total || 0,
              needs_spotify_sync: false,
              last_synced_at: new Date().toISOString()
            }
            
            const { error: updateError } = await supabase
              .from('artists')
              .update(updateData)
              .eq('id', artist.id)
            
            if (updateError) {
              console.error(`Failed to update artist ${artist.name}:`, updateError)
              errorCount++
            } else {
              console.log(`Updated artist: ${artist.name}`)
              updatedCount++
              
              // Sync artist's top tracks
              await syncArtistTopTracks(supabase, accessToken, artist.id, spotifyData.id)
            }
          } else {
            console.log(`No Spotify data found for artist: ${artist.name}`)
            
            // Mark as synced even if no data found to avoid repeated attempts
            await supabase
              .from('artists')
              .update({
                needs_spotify_sync: false,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', artist.id)
          }
          
          processedCount++
          
          // Rate limiting - Spotify allows 100 requests per second
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`Error processing artist ${artist.name}:`, error)
          errorCount++
          processedCount++
        }
      }
    }
    
    // Update sync state
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'spotify_enhanced_sync',
        last_sync_date: new Date().toISOString(),
        records_processed: processedCount,
        records_created: updatedCount,
        status: 'completed',
        error_message: errorCount > 0 ? `${errorCount} errors occurred` : null,
        updated_at: new Date().toISOString()
      })
    
    console.log(`Spotify sync completed: ${processedCount} processed, ${updatedCount} updated, ${errorCount} errors`)
    
    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      updated: updatedCount,
      errors: errorCount,
      message: `Processed ${processedCount} artists, updated ${updatedCount}, ${errorCount} errors`
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Spotify sync error:', error)
    
    // Update sync state with error
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'spotify_enhanced_sync',
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

async function syncArtistTopTracks(
  supabase: any, 
  accessToken: string, 
  artistId: string, 
  spotifyArtistId: string
) {
  try {
    // Get artist's top tracks from Spotify
    const topTracksResponse = await fetch(
      `https://api.spotify.com/v1/artists/${spotifyArtistId}/top-tracks?market=US`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (!topTracksResponse.ok) {
      console.error(`Failed to fetch top tracks for artist ${spotifyArtistId}`)
      return
    }
    
    const topTracksData = await topTracksResponse.json()
    const tracks: SpotifyTrack[] = topTracksData.tracks || []
    
    if (tracks.length === 0) {
      console.log(`No top tracks found for artist ${spotifyArtistId}`)
      return
    }
    
    // Prepare tracks for insertion/update
    const songsToUpsert = tracks.map((track) => ({
      artist_id: artistId,
      spotify_id: track.id,
      title: track.name,
      album: track.album.name,
      album_image_url: track.album.images?.[0]?.url || null,
      duration_ms: track.duration_ms,
      popularity: track.popularity,
      preview_url: track.preview_url,
      spotify_url: track.external_urls.spotify
    }))
    
    // Insert/update songs in batches
    const batchSize = 10
    for (let i = 0; i < songsToUpsert.length; i += batchSize) {
      const batch = songsToUpsert.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from('songs')
        .upsert(batch, {
          onConflict: 'spotify_id',
          ignoreDuplicates: false
        })
      
      if (error) {
        console.error(`Error upserting songs batch:`, error)
      } else {
        console.log(`Upserted ${batch.length} songs for artist ${artistId}`)
      }
      
      // Rate limiting between batches
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
  } catch (error) {
    console.error(`Error syncing top tracks for artist ${artistId}:`, error)
  }
}