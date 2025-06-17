import { createServerClient } from '@/lib/supabase-server'

export interface HomepageShow {
  id: string
  date: string
  name: string
  title?: string
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
    // Try to use the new enhanced homepage content RPC
    const { data: homepageData, error: homepageError } = await supabase
      .rpc('get_homepage_content_enhanced', {
        show_limit: 24,
        artist_limit: 12
      })

    if (!homepageError && homepageData && !homepageData.error) {
      // Transform the data to match our interface
      const shows: HomepageShow[] = (homepageData.shows || []).map((show: any) => ({
        id: show.id,
        date: show.date,
        name: show.name || show.title,
        title: show.title,
        trendingScore: show.trendingScore || show.trending_score || 50,
        totalVotes: show.totalVotes || show.total_votes || 0,
        uniqueVoters: show.uniqueVoters || show.unique_voters || 0,
        artist: {
          id: show.artist?.id || show.artist_id,
          name: show.artist?.name || show.artist_name,
          slug: show.artist?.slug || show.artist_slug,
          imageUrl: show.artist?.imageUrl || show.artist?.image_url || show.artist_image_url,
        },
        venue: {
          id: show.venue?.id || show.venue_id,
          name: show.venue?.name || show.venue_name,
          city: show.venue?.city || show.venue_city,
          state: show.venue?.state || show.state,
        },
      }))

      const artists: HomepageArtist[] = (homepageData.artists || []).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        image_url: artist.image_url,
        genres: Array.isArray(artist.genres) ? artist.genres : [],
        popularity: artist.popularity || 0,
        followers: artist.followers || 0,
        upcoming_shows: artist.upcoming_shows || 0
      }))

      return { shows, artists }
    }

    // Fallback to original RPC function
    const { data: fallbackData, error: fallbackError } = await supabase
      .rpc('get_homepage_content', {
        show_limit: 24,
        artist_limit: 12
      })

    if (!fallbackError && fallbackData) {
      return {
        shows: fallbackData.shows || [],
        artists: fallbackData.artists || []
      }
    }

    // Last resort: manual queries
    console.warn('RPC functions failed, using manual queries')
    
    // Get shows manually
    const { data: showsData, error: showsError } = await supabase
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

    let shows: HomepageShow[] = []
    if (!showsError && showsData) {
      shows = showsData
        .filter(show => show.artist && show.venue)
        .map((show: any) => {
          const totalVotes = show.setlists?.reduce((acc: number, setlist: any) => {
            return acc + (setlist.setlist_songs?.reduce((sum: number, song: any) => 
              sum + (song.vote_count || 0), 0) || 0)
          }, 0) || 0

          return {
            id: show.id,
            date: show.date,
            name: show.title || `${show.artist.name} Live`,
            title: show.title,
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

    // Get artists manually
    const { data: artistsData, error: artistsError } = await supabase
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

    let artists: HomepageArtist[] = []
    if (!artistsError && artistsData) {
      // Remove duplicates and count shows per artist
      const artistMap = new Map()
      artistsData.forEach((artist: any) => {
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
    }

    return {
      shows: shows.slice(0, 24),
      artists: artists.slice(0, 12)
    }

  } catch (error) {
    console.error('Error fetching homepage content:', error)
    return {
      shows: [],
      artists: []
    }
  }
}