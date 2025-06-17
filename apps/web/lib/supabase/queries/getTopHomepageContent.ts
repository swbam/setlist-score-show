import { createServerClient } from '@/lib/supabase-server'

export interface HomepageShow {
  id: string
  date: string
  title: string
  trendingScore?: number
  totalVotes: number
  uniqueVoters?: number
  artist: {
    id: string
    name: string
    slug?: string
    imageUrl?: string
  }
  venue: {
    id: string
    name: string
    city: string
    state?: string
  }
}

export interface HomepageArtist {
  id: string
  name: string
  slug?: string
  image_url?: string
  genres: string[]
  popularity: number
  followers?: number
  upcoming_shows?: number
}

export interface HomepageContent {
  shows: HomepageShow[]
  artists: HomepageArtist[]
}

export async function getTopHomepageContent(): Promise<HomepageContent> {
  const supabase = createServerClient()
  
  try {
    // Try to use the new homepage content RPC if it exists
    const { data: homepageData, error: homepageError } = await supabase
      .rpc('get_homepage_content', {
        show_limit: 24,
        artist_limit: 12
      })

    if (!homepageError && homepageData) {
      return {
        shows: homepageData.shows || [],
        artists: homepageData.artists || []
      }
    }

    // Fallback to get_trending_shows_limited for shows
    let shows: HomepageShow[] = []
    const { data: trendingShows, error: trendingError } = await supabase
      .rpc('get_trending_shows_limited', { limit_count: 24 })
    
    if (!trendingError && trendingShows && trendingShows.length > 0) {
      shows = trendingShows.map((show: any) => ({
        id: show.id || show.show_id,
        date: show.date,
        title: show.title || `${show.artist_name} Live`,
        trendingScore: show.trending_score || 50,
        totalVotes: show.total_votes || 0,
        uniqueVoters: show.unique_voters || 0,
        artist: {
          id: show.artist_id,
          name: show.artist_name,
          slug: show.artist_slug,
          imageUrl: show.artist_image_url || show.image_url,
        },
        venue: {
          id: show.venue_id,
          name: show.venue_name,
          city: show.venue_city || show.city,
          state: show.state,
        },
      }))
    } else {
      // Fallback to upcoming shows with votes
      const { data: upcomingShows, error: upcomingError } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          status,
          artist:artists!inner(id, name, slug, image_url),
          venue:venues!inner(id, name, city, state, country),
          setlists!inner(
            setlist_songs(vote_count)
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('status', 'upcoming')
        .eq('venues.country', 'United States')
        .not('artists.image_url', 'is', null)
        .order('date', { ascending: true })
        .limit(24)

      if (!upcomingError && upcomingShows) {
        shows = upcomingShows
          .filter(show => show.artist && show.venue)
          .map((show: any) => {
            const totalVotes = show.setlists?.reduce((acc: number, setlist: any) => {
              return acc + (setlist.setlist_songs?.reduce((sum: number, song: any) => sum + (song.vote_count || 0), 0) || 0)
            }, 0) || 0

            return {
              id: show.id,
              date: show.date,
              title: show.title || `${show.artist.name} Live`,
              trendingScore: 50,
              totalVotes,
              uniqueVoters: totalVotes,
              artist: {
                id: show.artist.id,
                name: show.artist.name,
                slug: show.artist.slug,
                imageUrl: show.artist.image_url,
              },
              venue: {
                id: show.venue.id,
                name: show.venue.name,
                city: show.venue.city,
                state: show.venue.state,
              },
            }
          })
      }
    }

    // Get featured artists with upcoming shows
    let artists: HomepageArtist[] = []
    const { data: featuredArtists, error: artistsError } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        slug,
        image_url,
        genres,
        popularity,
        followers,
        shows!inner(id, date, status)
      `)
      .not('image_url', 'is', null)
      .eq('shows.status', 'upcoming')
      .gte('shows.date', new Date().toISOString().split('T')[0])
      .order('popularity', { ascending: false })
      .limit(30)

    if (!artistsError && featuredArtists) {
      // Remove duplicates and count shows per artist
      const artistMap = new Map()
      featuredArtists.forEach((artist: any) => {
        if (!artistMap.has(artist.id)) {
          artistMap.set(artist.id, {
            ...artist,
            upcoming_shows: 1,
            shows: undefined // Remove the shows array to clean up
          })
        } else {
          const existing = artistMap.get(artist.id)
          existing.upcoming_shows = (existing.upcoming_shows || 0) + 1
        }
      })
      
      artists = Array.from(artistMap.values()).slice(0, 12)
    } else {
      // Fallback to any artists with images
      const { data: fallbackArtists } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genres,
          popularity,
          followers
        `)
        .not('image_url', 'is', null)
        .order('followers', { ascending: false })
        .limit(12)

      artists = fallbackArtists || []
    }

    return {
      shows: shows.slice(0, 24), // Ensure we don't exceed 24 shows
      artists: artists.slice(0, 12) // Ensure we don't exceed 12 artists
    }

  } catch (error) {
    console.error('Error fetching homepage content:', error)
    return {
      shows: [],
      artists: []
    }
  }
}