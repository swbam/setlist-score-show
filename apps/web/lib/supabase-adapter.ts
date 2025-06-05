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
        shows: data?.map(show => ({
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
          setlists: data.setlists?.map(setlist => ({
            ...setlist,
            orderIndex: setlist.order_index,
            setlistSongs: setlist.setlist_songs?.map(ss => ({
              ...ss,
              voteCount: ss.vote_count,
              song: {
                ...ss.song,
                durationMs: ss.song?.duration_ms,
                spotifyUrl: ss.song?.spotify_url
              }
            })).sort((a, b) => a.position - b.position)
          }))
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
        artists: data?.map(artist => ({
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
      const [artistsRes, showsRes] = await Promise.all([
        supabase
          .from('artists')
          .select('id, name, slug, image_url')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
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
      ])

      return {
        search: {
          artists: artistsRes.data?.map(artist => ({
            ...artist,
            imageUrl: artist.image_url
          })) || [],
          shows: showsRes.data || [],
          songs: [] // TODO: Implement song search when songs table is populated
        }
      }
    } catch (error) {
      console.error('Error searching:', error)
      return {
        search: {
          artists: [],
          shows: [],
          songs: []
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
          vote: { id: 'temp-id', createdAt: new Date().toISOString() },
          newVoteCount: (await this.getVoteCount(setlistSongId)) || 1,
          votesRemaining: { daily: 49, show: 9 } // TODO: Calculate actual remaining votes
        }
      }
    } catch (error) {
      console.error('Error casting vote:', error)
      return {
        castVote: {
          success: false,
          error: error.message
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
}