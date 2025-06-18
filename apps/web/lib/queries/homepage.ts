import { supabase } from '@/lib/supabase'

export interface HomepageShow {
  id: string
  date: string
  title: string | null
  status: string
  viewCount: number
  artist: {
    id: string
    name: string
    slug: string
    imageUrl: string | null
    popularity: number
  }
  venue: {
    id: string
    name: string
    city: string
    state: string | null
    country: string
  }
  totalVotes: number
}

export interface HomepageArtist {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  popularity: number
  genres: string[]
  upcomingShows: number
}

export interface HomepageContent {
  shows: HomepageShow[]
  artists: HomepageArtist[]
}

export async function getTopHomepageContent(): Promise<HomepageContent> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, returning mock data')
      return getMockHomepageContent()
    }

    // Get top upcoming shows in the US with vote counts
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        title,
        status,
        view_count,
        artists!inner (
          id,
          name,
          slug,
          image_url,
          popularity
        ),
        venues!inner (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .in('venues.country', ['United States', 'US', 'USA'])
      .gte('artists.popularity', 40)
      .order('artists.popularity', { ascending: false })
      .order('date', { ascending: true })
      .limit(24)

    if (showsError) {
      console.error('Error fetching shows:', showsError)
      return getMockHomepageContent()
    }

    // Get vote counts for shows
    const showsWithVotes = await Promise.all(
      (showsData || []).map(async (show: any) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('show_id', show.id)

        return {
          id: show.id,
          date: show.date,
          title: show.title,
          status: show.status,
          viewCount: show.view_count || 0,
          artist: {
            id: show.artists.id,
            name: show.artists.name,
            slug: show.artists.slug,
            imageUrl: show.artists.image_url,
            popularity: show.artists.popularity
          },
          venue: {
            id: show.venues.id,
            name: show.venues.name,
            city: show.venues.city,
            state: show.venues.state,
            country: show.venues.country
          },
          totalVotes: count || 0
        }
      })
    )

    // Get top artists with upcoming shows
    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        slug,
        image_url,
        popularity,
        genres,
        shows!inner (
          id,
          date,
          status,
          venues!inner (
            country
          )
        )
      `)
      .gte('shows.date', new Date().toISOString().split('T')[0])
      .eq('shows.status', 'upcoming')
      .in('shows.venues.country', ['United States', 'US', 'USA'])
      .gte('popularity', 50)
      .order('popularity', { ascending: false })
      .limit(12)

    if (artistsError) {
      console.error('Error fetching artists:', artistsError)
    }

    // Process artists to get unique ones with show counts
    const artistsMap = new Map()
    artistsData?.forEach((artist: any) => {
      if (!artistsMap.has(artist.id)) {
        artistsMap.set(artist.id, {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          imageUrl: artist.image_url,
          popularity: artist.popularity,
          genres: artist.genres || [],
          upcomingShows: 0
        })
      }
      artistsMap.get(artist.id).upcomingShows++
    })

    const artists = Array.from(artistsMap.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12)

    return {
      shows: showsWithVotes,
      artists
    }
  } catch (error) {
    console.error('Error fetching homepage content:', error)
    return getMockHomepageContent()
  }
}

function getMockHomepageContent(): HomepageContent {
  const mockArtists: HomepageArtist[] = [
    {
      id: '1',
      name: 'Taylor Swift',
      slug: 'taylor-swift',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebf8b7c61eca98a9f196b8a1db',
      popularity: 100,
      genres: ['pop', 'country'],
      upcomingShows: 24
    },
    {
      id: '2',
      name: 'The Weeknd',
      slug: 'the-weeknd',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
      popularity: 95,
      genres: ['r&b', 'pop'],
      upcomingShows: 18
    },
    {
      id: '3',
      name: 'Bad Bunny',
      slug: 'bad-bunny',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71',
      popularity: 98,
      genres: ['reggaeton', 'latin'],
      upcomingShows: 22
    },
    {
      id: '4',
      name: 'Drake',
      slug: 'drake',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
      popularity: 96,
      genres: ['hip-hop', 'rap'],
      upcomingShows: 16
    },
    {
      id: '5',
      name: 'Olivia Rodrigo',
      slug: 'olivia-rodrigo',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebe03a98785f3658f0b6461ec4',
      popularity: 92,
      genres: ['pop', 'alternative'],
      upcomingShows: 20
    },
    {
      id: '6',
      name: 'Billie Eilish',
      slug: 'billie-eilish',
      imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb50a3147b4edd7701a876c6ce',
      popularity: 94,
      genres: ['alternative', 'pop'],
      upcomingShows: 31
    }
  ]

  const mockShows: HomepageShow[] = [
    {
      id: '1',
      date: '2025-07-15',
      title: 'Eras Tour',
      status: 'upcoming',
      viewCount: 15420,
      artist: {
        id: '1',
        name: 'Taylor Swift',
        slug: 'taylor-swift',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebf8b7c61eca98a9f196b8a1db',
        popularity: 100
      },
      venue: {
        id: '1',
        name: 'Madison Square Garden',
        city: 'New York',
        state: 'NY',
        country: 'United States'
      },
      totalVotes: 2340
    },
    {
      id: '2',
      date: '2025-07-20',
      title: 'After Hours Til Dawn Tour',
      status: 'upcoming',
      viewCount: 12800,
      artist: {
        id: '2',
        name: 'The Weeknd',
        slug: 'the-weeknd',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
        popularity: 95
      },
      venue: {
        id: '2',
        name: 'Staples Center',
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States'
      },
      totalVotes: 1890
    },
    {
      id: '3',
      date: '2025-07-25',
      title: 'Most Wanted Tour',
      status: 'upcoming',
      viewCount: 18500,
      artist: {
        id: '3',
        name: 'Bad Bunny',
        slug: 'bad-bunny',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71',
        popularity: 98
      },
      venue: {
        id: '3',
        name: 'American Airlines Arena',
        city: 'Miami',
        state: 'FL',
        country: 'United States'
      },
      totalVotes: 2100
    },
    {
      id: '4',
      date: '2025-08-01',
      title: 'GUTS World Tour',
      status: 'upcoming',
      viewCount: 9200,
      artist: {
        id: '5',
        name: 'Olivia Rodrigo',
        slug: 'olivia-rodrigo',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebe03a98785f3658f0b6461ec4',
        popularity: 92
      },
      venue: {
        id: '4',
        name: 'United Center',
        city: 'Chicago',
        state: 'IL',
        country: 'United States'
      },
      totalVotes: 1650
    },
    {
      id: '5',
      date: '2025-08-10',
      title: 'Hit Me Hard and Soft Tour',
      status: 'upcoming',
      viewCount: 11300,
      artist: {
        id: '6',
        name: 'Billie Eilish',
        slug: 'billie-eilish',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb50a3147b4edd7701a876c6ce',
        popularity: 94
      },
      venue: {
        id: '5',
        name: 'The Forum',
        city: 'Los Angeles',
        state: 'CA',
        country: 'United States'
      },
      totalVotes: 1980
    },
    {
      id: '6',
      date: '2025-08-15',
      title: 'It\'s All a Blur Tour',
      status: 'upcoming',
      viewCount: 14700,
      artist: {
        id: '4',
        name: 'Drake',
        slug: 'drake',
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
        popularity: 96
      },
      venue: {
        id: '6',
        name: 'Scotiabank Arena',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada'
      },
      totalVotes: 1750
    }
  ]

  return {
    shows: mockShows,
    artists: mockArtists
  }
}
