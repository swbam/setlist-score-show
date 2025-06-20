'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, Users, Loader2 } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ShowCard } from '@/components/shows/ShowCard'
import { ArtistCard } from '@/components/home/ArtistCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type TabType = 'TRENDING' | 'UPCOMING' | 'ARTISTS'

interface Artist {
  id: string
  name: string
  slug: string
  image_url?: string
  upcoming_shows_count?: number
  popularity?: number
}

interface Show {
  id: string
  title: string
  date: string
  status: string
  artists: any
  venues: any
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('TRENDING')
  const [trendingShows, setTrendingShows] = useState<Show[]>([])
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([])
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)
  
  const supabase = createClientComponentClient()

  const loadTrendingShows = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          title,
          date,
          status,
          artists!inner(
            id,
            name,
            slug,
            image_url
          ),
          venues!inner(
            id,
            name,
            city,
            state
          )
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(20)

      if (data) {
        setTrendingShows(data)
      }
    } catch (error) {
      console.error('Error loading trending shows:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingShows = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          title,
          date,
          status,
          artists!inner(
            id,
            name,
            slug,
            image_url
          ),
          venues!inner(
            id,
            name,
            city,
            state,
            capacity
          )
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(24)

      if (data) {
        setUpcomingShows(data)
      }
    } catch (error) {
      console.error('Error loading upcoming shows:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadArtists = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, popularity')
        .order('popularity', { ascending: false })
        .limit(24)

      if (data) {
        setArtists(data)
      }
    } catch (error) {
      console.error('Error loading artists:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'TRENDING':
        if (trendingShows.length === 0) {
          loadTrendingShows()
        }
        break
      case 'UPCOMING':
        if (upcomingShows.length === 0) {
          loadUpcomingShows()
        }
        break
      case 'ARTISTS':
        if (artists.length === 0) {
          loadArtists()
        }
        break
    }
  }, [activeTab])

  const tabOptions = [
    { value: 'TRENDING' as const, label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'UPCOMING' as const, label: 'Top Shows', icon: <Calendar className="w-4 h-4" /> },
    { value: 'ARTISTS' as const, label: 'Artists', icon: <Users className="w-4 h-4" /> }
  ]

  const transformShow = (show: Show) => {
    const artist = Array.isArray(show.artists) ? show.artists[0] : show.artists
    const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues
    
    return {
      id: show.id,
      date: show.date,
      title: show.title || `${artist?.name} at ${venue?.name}`,
      status: show.status,
      artist: {
        id: artist?.id,
        name: artist?.name || 'Unknown Artist',
        slug: artist?.slug || '',
        image_url: artist?.image_url
      },
      venue: {
        id: venue?.id,
        name: venue?.name || 'Unknown Venue',
        city: venue?.city || 'Unknown City',
        state: venue?.state,
        capacity: venue?.capacity
      },
      total_votes: 0
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-bold mb-2 gradient-text">
            Explore
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover trending shows and artists
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <SegmentedControl
            value={activeTab}
            onChange={(value) => setActiveTab(value as TabType)}
            options={tabOptions}
            className="max-w-md"
          />
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'TRENDING' && (
              <div>
                {trendingShows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {trendingShows.map((show) => (
                      <ShowCard
                        key={show.id}
                        show={transformShow(show)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No Trending Shows</h2>
                    <p className="text-muted-foreground">
                      Check back later for trending concerts
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'UPCOMING' && (
              <div>
                {upcomingShows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {upcomingShows.map((show) => (
                      <ShowCard
                        key={show.id}
                        show={transformShow(show)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No Upcoming Shows</h2>
                    <p className="text-muted-foreground">
                      Check back later for upcoming concerts
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ARTISTS' && (
              <div>
                {artists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                         {artists.map((artist, index) => (
                       <ArtistCard
                         key={artist.id}
                         artist={{
                           ...artist,
                           image_url: artist.image_url || null
                         }}
                         index={index}
                       />
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No Artists Found</h2>
                    <p className="text-muted-foreground">
                      Check back later for featured artists
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 