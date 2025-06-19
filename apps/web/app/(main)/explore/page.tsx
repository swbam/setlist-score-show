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
            onValueChange={(value) => setActiveTab(value as TabType)}
            options={tabOptions}
            className="max-w-md"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'TRENDING' && (
          <div>
            {loadingTrending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : trendingShows.length > 0 ? (
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
                      },
                      totalVotes: show.totalVotes || 0
                    }}
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
              <>
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
              </>
            ) : (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Upcoming Shows</h2>
                <p className="text-muted-foreground">
                  Check back later for new concerts
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ARTISTS' && (
          <div>
            {loadingArtistsQuery ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : artists.length > 0 ? (
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
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Artists Found</h2>
                <p className="text-muted-foreground">
                  Start by importing artists from the admin dashboard
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 