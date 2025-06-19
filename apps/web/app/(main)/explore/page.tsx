'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Calendar, Users, Loader2 } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ShowCard } from '@/components/shows/ShowCard'
import { InfiniteList } from '@/components/ui/InfiniteList'
import Link from 'next/link'
import { ArtistCard } from '@/components/home/ArtistCard'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS, GET_FEATURED_ARTISTS } from '@/lib/graphql/queries'

type TabType = 'TRENDING' | 'UPCOMING' | 'ARTISTS'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  upcomingShowsCount?: number
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<TabType>('TRENDING')
  const [upcomingShows, setUpcomingShows] = useState<any[]>([])
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState(true)
  const [loadingUpcoming, setLoadingUpcoming] = useState(false)
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsPage, setArtistsPage] = useState(0)
  const [hasMoreArtists, setHasMoreArtists] = useState(true)
  const [loadingArtists, setLoadingArtists] = useState(false)
  
  const graphqlClient = useGraphQLClient()
  const PAGE_SIZE = 24

  // Trending shows query
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-shows'],
    enabled: activeTab === 'TRENDING',
    queryFn: async () => {
      const result: any = await graphqlClient.request(GET_TRENDING_SHOWS, { limit: 20 })
      return result.trendingShows || []
    }
  })

  // Artists query
  const { data: artistsData, isLoading: loadingArtistsQuery } = useQuery({
    queryKey: ['featured-artists'],
    enabled: activeTab === 'ARTISTS',
    queryFn: async () => {
      const result: any = await graphqlClient.request(GET_FEATURED_ARTISTS, { limit: 50 })
      return result.featuredArtists || []
    }
  })

  // For ARTISTS tab, use the GraphQL data instead of pagination
  useEffect(() => {
    if (activeTab === 'ARTISTS' && artistsData) {
      setArtists(artistsData.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.imageUrl,
        upcomingShowsCount: 0
      })))
    }
  }, [activeTab, artistsData])

  // Load more upcoming shows - simplified to use GraphQL fallback
  const loadMoreUpcoming = async () => {
    if (loadingUpcoming || !hasMoreUpcoming) return
    
    setLoadingUpcoming(true)
    try {
      // For now, just use the trending data as upcoming shows
      const result: any = await graphqlClient.request(GET_TRENDING_SHOWS, { limit: PAGE_SIZE })
      const newShows = result.trendingShows || []

      if (newShows.length < PAGE_SIZE) {
        setHasMoreUpcoming(false)
      }

      setUpcomingShows(prev => [...prev, ...newShows])
      setUpcomingPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading upcoming shows:', error)
    } finally {
      setLoadingUpcoming(false)
    }
  }

  // Load more artists - simplified 
  const loadMoreArtists = async () => {
    // Since we're using GraphQL, disable pagination for now
    setHasMoreArtists(false)
  }

  // Initialize data when tab changes
  useEffect(() => {
    if (activeTab === 'UPCOMING' && upcomingShows.length === 0) {
      loadMoreUpcoming()
    }
    if (activeTab === 'ARTISTS' && artists.length === 0) {
      loadMoreArtists()
    }
  }, [activeTab])

  const tabOptions = [
    { value: 'TRENDING' as const, label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'UPCOMING' as const, label: 'Top Shows', icon: <Calendar className="w-4 h-4" /> },
    { value: 'ARTISTS' as const, label: 'Artists', icon: <Users className="w-4 h-4" /> }
  ]

  const trendingShows = trendingData || []

  const renderArtistCard = (artist: Artist, index: number) => (
    <ArtistCard
      key={artist.id}
      artist={{
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        image_url: artist.imageUrl || null,
        upcoming_shows_count: artist.upcomingShowsCount,
        popularity: undefined
      }}
      index={index}
    />
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text">
            Explore Shows
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body mb-6">
            Discover trending shows, top concerts, and your favorite artists
          </p>

          {/* Tab Control */}
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(value: TabType) => setActiveTab(value)}
            className="mb-6"
          />
        </div>

        {/* Content */}
        {activeTab === 'TRENDING' && (
          <div>
            {loadingTrending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {trendingShows.map((show: any) => (
                  <ShowCard
                    key={show.id}
                    show={{
                      id: show.id,
                      date: show.date,
                      title: show.title || `${show.artist?.name} at ${show.venue?.name}`,
                      status: 'upcoming',
                      viewCount: show.viewCount || 0,
                      trendingScore: show.trendingScore,
                      artist: {
                        id: show.artist?.id,
                        name: show.artist?.name || 'Unknown Artist',
                        slug: show.artist?.slug || '',
                        imageUrl: show.artist?.imageUrl
                      },
                      venue: {
                        id: show.venue?.id,
                        name: show.venue?.name || 'Unknown Venue',
                        city: show.venue?.city || 'Unknown City',
                        state: show.venue?.state,
                        country: show.venue?.country || 'Unknown Country'
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'UPCOMING' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {upcomingShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
            
            {hasMoreUpcoming && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMoreUpcoming}
                  disabled={loadingUpcoming}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingUpcoming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ARTISTS' && (
          <div className="h-[calc(100vh-300px)]">
            <InfiniteList
              items={artists}
              isLoading={loadingArtists}
              hasMore={hasMoreArtists}
              loadMore={loadMoreArtists}
              itemHeight={80}
              renderItem={renderArtistCard}
            />
          </div>
        )}
      </div>
    </div>
  )
} 