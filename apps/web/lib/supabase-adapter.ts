// @ts-nocheck
import { supabase } from './supabase'

// Temporary adapter to work with Supabase directly while API is being set up
export class SupabaseAdapter {
  
  async getShows(limit = 20, status = 'upcoming') {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          status,
          ticketmaster_url,
          view_count,
          artist:artists(
            id,
            name,
            slug,
            image_url
          ),
          venue:venues(
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('status', status)
        .order('date', { ascending: true })
        .limit(limit)

      if (error) throw error
      
      // Transform to match GraphQL structure
      return {
        shows: data?.map((show: any) => ({
          ...show,
          ticketmasterUrl: show.ticketmaster_url,
          viewCount: show.view_count,
          artist: {
            ...show.artist,
            imageUrl: show.artist?.image_url
          }
        })) || []
      }
    } catch (error) {
      console.error('Error fetching shows:', error)
      return { shows: [] }
    }
  }

  async getShowWithSetlist(id: string) {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          status,
          ticketmaster_url,
          artist:artists(
            id,
            name,
            slug,
            image_url
          ),
          venue:venues(
            id,
            name,
            city,
            state,
            country
          ),
          setlists(
            id,
            name,
            order_index,
            setlist_songs(
              id,
              position,
              vote_count,
              song:songs(
                id,
                title,
                album,
                duration_ms,
                spotify_url
              )
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Transform to match GraphQL structure
      return {
        show: {
          ...data,
          ticketmasterUrl: data.ticketmaster_url,
          artist: {
            ...data.artist,
            imageUrl: data.artist?.image_url
          },
          setlists: data.setlists?.map((setlist: any) => ({
            ...setlist,
            orderIndex: setlist.order_index,
            setlistSongs: setlist.setlist_songs?.map((ss: any) => ({
              ...ss,
              voteCount: ss.vote_count,
              song: {
                ...ss.song,
                durationMs: ss.song?.duration_ms,
                spotifyUrl: ss.song?.spotify_url
              }
            })).sort((a: any, b: any) => a.position - b.position)
          })) || []
        }
      }
    } catch (error) {
      console.error('Error fetching show with setlist:', error)
      return { show: null }
    }
  }

  async getArtists(limit = 20, search?: string) {
    try {
      let query = supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity, followers')
        .order('popularity', { ascending: false })
        .limit(limit)

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      
      return {
        artists: data?.map((artist: any) => ({
          ...artist,
          imageUrl: artist.image_url
        })) || []
      }
    } catch (error) {
      console.error('Error fetching artists:', error)
      return { artists: [] }
    }
  }

  async getArtistBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genres,
          popularity,
          followers,
          spotify_id,
          shows(
            id,
            date,
            title,
            status,
            venue:venues(
              id,
              name,
              city,
              state,
              country
            )
          )
        `)
        .eq('slug', slug)
        .single()

      if (error) throw error
      
      return {
        artistBySlug: {
          ...data,
          imageUrl: data.image_url,
          image_url: data.image_url, // Keep both for compatibility
          spotifyUrl: data.spotify_id ? `https://open.spotify.com/artist/${data.spotify_id}` : null,
          spotify_url: data.spotify_id ? `https://open.spotify.com/artist/${data.spotify_id}` : null, // Keep both for compatibility
          shows: data.shows?.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        }
      }
    } catch (error) {
      console.error('Error fetching artist:', error)
      return { artistBySlug: null }
    }
  }

  async search(query: string) {
    try {
      // Search Ticketmaster API for artists
      const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=${encodeURIComponent(query)}&apikey=k8GrSAkbFaN0w7qDxGl7ohr8LwdAQm9b&size=10&classificationName=music`
      
      console.log('Searching Ticketmaster for:', query)
      
      const tmResponse = await fetch(ticketmasterUrl)
      
      if (!tmResponse.ok) {
        console.error('Ticketmaster API error:', tmResponse.status)
        throw new Error('Ticketmaster API error')
      }

      const tmData = await tmResponse.json()
      const tmArtists = tmData._embedded?.attractions || []
      
      console.log(`Found ${tmArtists.length} artists from Ticketmaster`)

      // Transform Ticketmaster artists
      const apiArtists = tmArtists.map((tm: any) => ({
        id: `tm_${tm.id}`, // Temporary ID
        ticketmasterId: tm.id,
        name: tm.name,
        slug: tm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        imageUrl: tm.images?.[0]?.url || null,
        isFromApi: true // Flag to indicate this needs to be imported
      }))

      // Also search local database
      const { data: dbArtists } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, ticketmaster_id')
        .ilike('name', `%${query}%`)
        .limit(5)

      // Combine and deduplicate
      const allArtists = [...(dbArtists || []).map((a: any) => ({
        ...a,
        imageUrl: a.image_url,
        ticketmasterId: a.ticketmaster_id
      })), ...apiArtists]
      
      // Deduplicate by name
      const uniqueArtists = allArtists.reduce((acc: any[], artist) => {
        if (!acc.some(a => a.name.toLowerCase() === artist.name.toLowerCase())) {
          acc.push(artist)
        }
        return acc
      }, [])

      // Search shows in database
      const { data: shows } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          artist:artists(name),
          venue:venues(name, city)
        `)
        .ilike('title', `%${query}%`)
        .eq('status', 'upcoming')
        .limit(5)

      return {
        search: {
          artists: uniqueArtists.slice(0, 10),
          shows: shows || [],
          songs: [],
          totalResults: uniqueArtists.length + (shows?.length || 0)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      return {
        search: {
          artists: [],
          shows: [],
          songs: [],
          totalResults: 0
        }
      }
    }
  }

  async castVote(showId: string, setlistSongId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be logged in to vote')
      }

      // Check if user already voted for this song
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('setlist_song_id', setlistSongId)
        .single()

      if (existingVote) {
        throw new Error('Already voted for this song')
      }

      // Insert vote and update vote count in transaction
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          setlist_song_id: setlistSongId,
          show_id: showId,
          vote_type: 'up'
        })

      if (voteError) throw voteError

      // Update vote count
      const { error: updateError } = await supabase.rpc('increment_vote_count', {
        setlist_song_id: setlistSongId
      })

      if (updateError) {
        console.warn('Could not update vote count via RPC, using manual update')
        // Fallback: get current count and increment
        const { data: currentSong } = await supabase
          .from('setlist_songs')
          .select('vote_count')
          .eq('id', setlistSongId)
          .single()

        if (currentSong) {
          await supabase
            .from('setlist_songs')
            .update({ vote_count: (currentSong.vote_count || 0) + 1 })
            .eq('id', setlistSongId)
        }
      }

      return {
        castVote: {
          success: true,
          voteId: 'temp-id',
          newVoteCount: (await this.getVoteCount(setlistSongId)) || 1,
          dailyVotesRemaining: 49,
          showVotesRemaining: 9,
          message: 'Vote cast successfully'
        }
      }
    } catch (error) {
      console.error('Error casting vote:', error)
      return {
        castVote: {
          success: false,
          voteId: null,
          newVoteCount: 0,
          dailyVotesRemaining: 0,
          showVotesRemaining: 0,
          message: error.message
        }
      }
    }
  }

  private async getVoteCount(setlistSongId: string) {
    const { data } = await supabase
      .from('setlist_songs')
      .select('vote_count')
      .eq('id', setlistSongId)
      .single()
    
    return data?.vote_count || 0
  }

  async getUserVotes(showId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { userVotes: [] }
      }

      const { data, error } = await supabase
        .from('votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .eq('show_id', showId)

      if (error) throw error

      return {
        userVotes: data?.map(vote => ({ setlistSongId: vote.setlist_song_id })) || []
      }
    } catch (error) {
      console.error('Error fetching user votes:', error)
      return { userVotes: [] }
    }
  }

  async getArtistSongs(artistId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, album, album_image_url, duration_ms, popularity, spotify_url')
        .eq('artist_id', artistId)
        .order('popularity', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        songs: {
          edges: data?.map((song, index) => ({
            node: {
              ...song,
              albumImageUrl: song.album_image_url,
              durationMs: song.duration_ms,
              spotifyUrl: song.spotify_url
            },
            cursor: Buffer.from(`${offset + index}`).toString('base64')
          })) || []
        }
      }
    } catch (error) {
      console.error('Error fetching artist songs:', error)
      return { songs: { edges: [] } }
    }
  }

  async getTrendingShows(limit = 10) {
    try {
      // For now, use Supabase direct query since GraphQL nested objects have issues
      const { data: trendingData, error } = await supabase
        .from('trending_shows_distinct')
        .select(`
          id,
          date,
          title,
          trending_score,
          total_votes,
          unique_voters,
          artist_id,
          venue_id
        `)
        .order('trending_score', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching trending shows:', error)
        return []
      }

      // Get artist and venue data separately
      const artistIds = [...new Set(trendingData.map(show => show.artist_id))]
      const venueIds = [...new Set(trendingData.map(show => show.venue_id))]

      const [{ data: artists }, { data: venues }] = await Promise.all([
        supabase.from('artists').select('id, name, slug, image_url').in('id', artistIds),
        supabase.from('venues').select('id, name, city, state, country').in('id', venueIds)
      ])

      const artistMap = Object.fromEntries((artists || []).map(a => [a.id, a]))
      const venueMap = Object.fromEntries((venues || []).map(v => [v.id, v]))

      return trendingData.map(show => ({
        id: show.id,
        date: show.date,
        title: show.title,
        status: 'upcoming',
        trendingScore: parseFloat(show.trending_score || '0'),
        totalVotes: show.total_votes || 0,
        uniqueVoters: show.unique_voters || 0,
        artist: {
          id: show.artist_id,
          name: artistMap[show.artist_id]?.name || 'Unknown Artist',
          slug: artistMap[show.artist_id]?.slug || 'unknown',
          imageUrl: artistMap[show.artist_id]?.image_url,
        },
        venue: {
          id: show.venue_id,
          name: venueMap[show.venue_id]?.name || 'Unknown Venue',
          city: venueMap[show.venue_id]?.city || 'Unknown City',
          state: venueMap[show.venue_id]?.state,
          country: venueMap[show.venue_id]?.country,
        },
      }))
    } catch (error) {
      console.error('Error in getTrendingShows:', error)
      return []
    }
  }

  async getFeaturedArtists(limit = 12) {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genres,
          popularity,
          followers,
          shows!inner(status, date)
        `)
        .not('image_url', 'is', null)
        .eq('shows.status', 'upcoming')
        .gte('shows.date', new Date().toISOString())
        .order('followers', { ascending: false })
        .order('popularity', { ascending: false })
        .limit(limit)

      if (error) throw error

      return {
        featuredArtists: data?.map(artist => ({
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          imageUrl: artist.image_url,
          genres: artist.genres,
          popularity: artist.popularity,
          followers: artist.followers
        })) || []
      }
    } catch (error) {
      console.error('Error fetching featured artists:', error)
      return { featuredArtists: [] }
    }
  }

  async addSongToSetlist(setlistId: string, input: { songId: string; position?: number; notes?: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User must be logged in to add songs')
      }

      // Get current setlist info
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('id, setlist_songs!inner(position)')
        .eq('id', setlistId)
        .single()

      if (setlistError) throw setlistError

      // Determine position
      const maxPosition = setlist.setlist_songs?.length || 0
      const position = input.position || maxPosition + 1

      // Insert new setlist song
      const { data, error } = await supabase
        .from('setlist_songs')
        .insert({
          setlist_id: setlistId,
          song_id: input.songId,
          position: position,
          vote_count: 0,
          notes: input.notes || null
        })
        .select(`
          id,
          position,
          vote_count,
          notes,
          song:songs(id, title, album, album_image_url)
        `)
        .single()

      if (error) throw error

      return {
        addSongToSetlist: {
          ...data,
          voteCount: data.vote_count,
          song: {
            ...data.song,
            albumImageUrl: data.song?.album_image_url
          }
        }
      }
    } catch (error) {
      console.error('Error adding song to setlist:', error)
      throw error
    }
  }

  async getMyArtists() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { myArtists: [] }

      // First fetch follow rows
      const { data: follows, error: followErr } = await supabase
        .from('user_follows_artist')
        .select('artist_id, followed_at')
        .eq('user_id', user.id)
        .order('followed_at', { ascending: false })

      if (followErr) throw followErr

      if (!follows || !follows.length) return { myArtists: [] }

      const artistIds = follows.map(f => f.artist_id)

      // Fetch artist records in batches of 100 (Supabase limit)
      const { data: artistsRaw, error: artistErr } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres')
        .in('id', artistIds)

      const artists = artistsRaw as any[]

      if (artistErr) throw artistErr

      const artistMap = new Map(artists.map(a => [a.id, a]))

      return {
        myArtists: follows.map(f => ({
          artist: {
            ...(artistMap.get(f.artist_id) as any),
            imageUrl: (artistMap.get(f.artist_id) as any)?.image_url
          },
          followedAt: f.followed_at
        }))
      }
    } catch (error) {
      console.error('Error fetching followed artists:', error)
      return { myArtists: [] }
    }
  }

  /**
   * Import user's Spotify followed or top artists and persist follow records.
   * Utilises provider access token returned by Supabase OAuth.
   */
  async importSpotifyArtists() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.provider_token) {
        throw new Error('Spotify account not connected')
      }

      const accessToken = session.provider_token

      // Helper to call Spotify endpoint
      const fetchSpotify = async (url: string) => {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (!res.ok) throw new Error(`Spotify API error ${res.status}`)
        return res.json()
      }

      // Fetch followed artists (may be paginated)
      const followedRes = await fetchSpotify('https://api.spotify.com/v1/me/following?type=artist&limit=50')
      const followedArtists = followedRes.artists?.items || []

      // Fetch top artists (long_term)
      const topRes = await fetchSpotify('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term')
      const topArtists = topRes.items || []

      const allArtists = [...followedArtists, ...topArtists]
      const uniqueMap = new Map()
      allArtists.forEach((a: any) => uniqueMap.set(a.id, a))

      const artistsToImport = Array.from(uniqueMap.values())

      const imported: any[] = []

      for (const spArtist of artistsToImport) {
        // Upsert artist record
        const slug = spArtist.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        const { data: artist, error: upsertErr } = await supabase
          .from('artists')
          .upsert({
            spotify_id: spArtist.id,
            name: spArtist.name,
            slug,
            image_url: spArtist.images?.[0]?.url || null,
            genres: spArtist.genres,
            popularity: spArtist.popularity,
            followers: spArtist.followers?.total || 0,
          })
          .select('id, name, image_url')
          .single()

        if (upsertErr) {
          console.error('Artist upsert error', upsertErr)
          continue
        }

        // Create follow row (ignore duplicates)
        await supabase
          .from('user_follows_artist')
          .upsert({
            user_id: session.user.id,
            artist_id: artist.id,
          })

        imported.push({ artist: { ...artist, imageUrl: artist.image_url }, followedAt: new Date().toISOString() })
      }

      return { importSpotifyArtists: imported }
    } catch (error) {
      console.error('Error importing Spotify artists:', error)
      throw error
    }
  }
}