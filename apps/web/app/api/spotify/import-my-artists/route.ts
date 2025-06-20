import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface SpotifyArtist {
  id: string
  name: string
  images: Array<{ url: string; height: number; width: number }>
  genres: string[]
  followers: { total: number }
  popularity: number
  priority?: 'followed' | 'top'
}

interface ImportResult {
  artist_id: string
  artist_name: string
  already_existed: boolean
  upcoming_shows_count: number
  songs_imported: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get session to access provider token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.provider_token || !session?.provider_refresh_token) {
      return NextResponse.json({ 
        error: 'Spotify connection required',
        requiresAuth: true 
      }, { status: 401 })
    }

    const spotifyToken = session.provider_token

    console.log('🎵 Starting Spotify import for user:', user.id)

    // Step 1: Fetch user's followed artists from Spotify
    const followedArtists = await fetchFollowedArtists(spotifyToken)
    
    // Step 2: Fetch user's top artists (for better personalization)
    const topArtists = await fetchTopArtists(spotifyToken)
    
    // Combine and deduplicate artists
    const allArtistsMap = new Map<string, SpotifyArtist>()
    
    // Add followed artists (higher priority)
    followedArtists.forEach(artist => allArtistsMap.set(artist.id, { ...artist, priority: 'followed' }))
    
    // Add top artists (only if not already followed)
    topArtists.forEach(artist => {
      if (!allArtistsMap.has(artist.id)) {
        allArtistsMap.set(artist.id, { ...artist, priority: 'top' })
      }
    })

    const uniqueArtists = Array.from(allArtistsMap.values())
    console.log(`📊 Found ${uniqueArtists.length} unique artists (${followedArtists.length} followed, ${topArtists.length} top)`)

    if (uniqueArtists.length === 0) {
      return NextResponse.json({ 
        error: 'No artists found in your Spotify account',
        imported: [],
        summary: { total: 0, imported: 0, with_shows: 0 }
      })
    }

    // Step 3: Import artists to database and check for shows
    const importResults: ImportResult[] = []
    const BATCH_SIZE = 5 // Process in smaller batches to avoid timeouts

    for (let i = 0; i < uniqueArtists.length; i += BATCH_SIZE) {
      const batch = uniqueArtists.slice(i, i + BATCH_SIZE)
      
      const batchResults = await Promise.all(
        batch.map(async (spotifyArtist): Promise<ImportResult> => {
          try {
            // Import artist using the database function
            const { data: importedArtist, error: importError } = await supabase
              .rpc('import_spotify_artist', {
                p_spotify_id: spotifyArtist.id,
                p_name: spotifyArtist.name,
                p_image_url: spotifyArtist.images[0]?.url || null,
                p_genres: spotifyArtist.genres || [],
                p_followers: spotifyArtist.followers?.total || 0,
                p_popularity: spotifyArtist.popularity || 50
              })

            if (importError) {
              console.error(`Failed to import ${spotifyArtist.name}:`, importError)
              return {
                artist_id: '',
                artist_name: spotifyArtist.name,
                already_existed: false,
                upcoming_shows_count: 0,
                songs_imported: 0
              }
            }

            const artistData = importedArtist?.[0]
            if (!artistData) {
              throw new Error('No artist data returned')
            }

            // Link artist to user
            await supabase.from('user_artists').upsert({
              user_id: user.id,
              artist_id: artistData.id,
              source: 'spotify_import',
              spotify_data: {
                followed: spotifyArtist.priority === 'followed',
                top_artist: spotifyArtist.priority === 'top',
                import_date: new Date().toISOString()
              }
            })

            // Check for upcoming shows
            const { data: shows } = await supabase
              .from('shows')
              .select('id, date, title')
              .eq('artist_id', artistData.id)
              .eq('status', 'upcoming')
              .gte('date', new Date().toISOString())

            return {
              artist_id: artistData.id,
              artist_name: artistData.name,
              already_existed: artistData.already_existed || false,
              upcoming_shows_count: shows?.length || 0,
              songs_imported: artistData.songs_imported || 0
            }

          } catch (error) {
            console.error(`Error processing ${spotifyArtist.name}:`, error)
            return {
              artist_id: '',
              artist_name: spotifyArtist.name,
              already_existed: false,
              upcoming_shows_count: 0,
              songs_imported: 0
            }
          }
        })
      )

      importResults.push(...batchResults)
      
      // Add small delay between batches
      if (i + BATCH_SIZE < uniqueArtists.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Calculate summary
    const summary = {
      total: uniqueArtists.length,
      imported: importResults.filter(r => r.artist_id).length,
      with_shows: importResults.filter(r => r.upcoming_shows_count > 0).length,
      total_shows: importResults.reduce((sum, r) => sum + r.upcoming_shows_count, 0),
      songs_imported: importResults.reduce((sum, r) => sum + r.songs_imported, 0)
    }

    console.log('✅ Spotify import completed:', summary)

    return NextResponse.json({
      success: true,
      imported: importResults.filter(r => r.artist_id), // Only successful imports
      summary
    })

  } catch (error) {
    console.error('💥 Spotify import error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Import failed' 
    }, { status: 500 })
  }
}

async function fetchFollowedArtists(token: string): Promise<SpotifyArtist[]> {
  const artists: SpotifyArtist[] = []
  let url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50'
  
  try {
    while (url && artists.length < 200) { // Limit to 200 for performance
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Spotify token expired')
        }
        throw new Error(`Spotify API error: ${response.status}`)
      }
      
      const data = await response.json()
      const newArtists = data.artists?.items || []
      artists.push(...newArtists)
      
      url = data.artists?.next
    }
  } catch (error) {
    console.error('Error fetching followed artists:', error)
  }
  
  return artists
}

async function fetchTopArtists(token: string): Promise<SpotifyArtist[]> {
  const artists: SpotifyArtist[] = []
  
  try {
    // Fetch short, medium, and long term top artists
    const timeRanges = ['short_term', 'medium_term', 'long_term']
    
    for (const timeRange of timeRanges) {
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        artists.push(...(data.items || []))
      }
    }
    
    // Deduplicate by ID
    const uniqueMap = new Map()
    artists.forEach(artist => uniqueMap.set(artist.id, artist))
    return Array.from(uniqueMap.values())
    
  } catch (error) {
    console.error('Error fetching top artists:', error)
    return []
  }
} 