'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS } from '@/lib/graphql/queries'
import { TrendingUp, Calendar, Users, Loader2 } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ShowCard } from '@/components/shows/ShowCard'
import { InfiniteList } from '@/components/ui/InfiniteList'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type TabType = 'TRENDING' | 'UPCOMING' | 'ARTISTS'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  upcomingShowsCount?: number
}

export default function ExplorePage() {
  const searchParams = useSearchParams()
  // Determine initial tab from URL (?tab=trending|upcoming|artists)
  const tabParam = (searchParams.get('tab') || '').toUpperCase()
  const validTabs: Record<string, TabType> = {
    TRENDING: 'TRENDING',
    UPCOMING: 'UPCOMING',
    ARTISTS: 'ARTISTS'
  }
  const [activeTab, setActiveTab] = useState<TabType>(
    validTabs[tabParam] ?? 'TRENDING'
  )
  const [upcomingShows, setUpcomingShows] = useState<any[]>([])
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState(true)
  const [loadingUpcoming, setLoadingUpcoming] = useState(false)
  const [artists, setArtists] = useState<Artist[]>([])
  const [artistsPage, setArtistsPage] = useState(0)
  const [hasMoreArtists, setHasMoreArtists] = useState(true)
  const [loadingArtists, setLoadingArtists] = useState(false)
  
  const client = useGraphQLClient()
  const PAGE_SIZE = 24

  // Trending shows query
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-shows'],
    queryFn: async () => {
      return client.request(GET_TRENDING_SHOWS, { limit: PAGE_SIZE })
    },
    enabled: activeTab === 'TRENDING'
  })

  // Load more upcoming shows
  const loadMoreUpcoming = async () => {
    if (loadingUpcoming || !hasMoreUpcoming) return
    
    setLoadingUpcoming(true)
    try {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          title,
          status,
          view_count,
          popularity,
          artist_id,
          venue_id,
          artists(
            id,
            name,
            slug,
            image_url
          ),
          venues(
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('popularity', { ascending: false })
        .order('date', { ascending: true })
        .range(upcomingPage * PAGE_SIZE, (upcomingPage + 1) * PAGE_SIZE - 1)

      if (error) throw error

      const newShows = data?.map((show: any) => ({
        id: show.id,
        date: show.date,
        title: show.title || `${show.artists?.name} at ${show.venues?.name}`,
        status: show.status,
        viewCount: show.view_count || 0,
        popularity: show.popularity || 0,
        artist: {
          id: show.artists?.id,
          name: show.artists?.name || 'Unknown Artist',
          slug: show.artists?.slug || '',
          imageUrl: show.artists?.image_url
        },
        venue: {
          id: show.venues?.id,
          name: show.venues?.name || 'Unknown Venue',
          city: show.venues?.city || 'Unknown City',
          state: show.venues?.state,
          country: show.venues?.country || 'Unknown Country'
        }
      })) || []

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

  // Load more artists
  const loadMoreArtists = async () => {
    if (loadingArtists || !hasMoreArtists) return
    
    setLoadingArtists(true)
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url
        `)
        .order('name')
        .range(artistsPage * 50, (artistsPage + 1) * 50 - 1)

      if (error) throw error
      
      const newArtists = data?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.image_url,
        upcomingShowsCount: 0 // We'll calculate this separately if needed
      })) || []

      if (newArtists.length < 50) {
        setHasMoreArtists(false)
      }

      setArtists(prev => [...prev, ...newArtists])
      setArtistsPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading artists:', error)
    } finally {
      setLoadingArtists(false)
    }
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

  // Keep activeTab in sync if query param changes (e.g., user navigates back)
  useEffect(() => {
    const newTabParam = (searchParams.get('tab') || '').toUpperCase()
    if (validTabs[newTabParam] && validTabs[newTabParam] !== activeTab) {
      setActiveTab(validTabs[newTabParam])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const tabOptions = [
    { value: 'TRENDING' as const, label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'UPCOMING' as const, label: 'Top Shows', icon: <Calendar className="w-4 h-4" /> },
    { value: 'ARTISTS' as const, label: 'Artists', icon: <Users className="w-4 h-4" /> }
  ]

  const trendingShows = (trendingData as any)?.trendingShows || []

  const renderArtistCard = (artist: Artist, index: number) => (
    <Link
      key={artist.id}
      href={`/artists/${artist.slug}`}
      className="group block p-3 rounded-lg bg-card hover:bg-card/80 transition-all duration-200 border border-border/50 hover:border-border hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="w-10 h-10 rounded-full object-cover border border-border/50"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {artist.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {artist.upcomingShowsCount || 0} upcoming shows
          </p>
        </div>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold mb-2 sm:mb-3 gradient-text">
            Explore Shows
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-body mb-4">
            Discover trending shows, top concerts, and your favorite artists
          </p>

          {/* Tab Control */}
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(value: TabType) => setActiveTab(value)}
            className="mb-4"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {upcomingShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
            
            {hasMoreUpcoming && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreUpcoming}
                  disabled={loadingUpcoming}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                >
                  {loadingUpcoming ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ARTISTS' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {artists.map((artist, index) => 
                renderArtistCard(artist, index)
              )}
            </div>
            
            {hasMoreArtists && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreArtists}
                  disabled={loadingArtists}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                >
                  {loadingArtists ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 