'use client' // Add this line to make it a client component for data fetching and state

import Link from 'next/link'
import { useEffect, useState } from 'react' // Import useEffect and useState
import { supabase } from '@/lib/supabase' // Import supabase client
import { ShowCardGrid } from '@/components/shows/ShowCardGrid' // Import ShowCardGrid component
import { FeaturedArtists } from '@/components/artists/FeaturedArtists' // Import FeaturedArtists component

// Make sure the TrendingShow interface matches the one in TrendingShows.tsx
// Based on previous tool output for TrendingShows.tsx, the interface is:
interface TrendingShow {
  show: {
    id: string;
    date: string;
    title?: string;
    artist: {
      id: string;
      name: string;
      imageUrl?: string;
    };
    venue: {
      id: string;
      name: string;
      city: string;
    };
  };
  totalVotes: number;
  uniqueVoters: number;
  trendingScore: number;
}

interface FeaturedArtist {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  genres?: string[];
  upcomingShowsCount?: number;
}

export default function HomePage() {
  const [trendingShows, setTrendingShows] = useState<TrendingShow[]>([])
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtist[]>([])
  const [isLoadingShows, setIsLoadingShows] = useState(true)
  const [isLoadingArtists, setIsLoadingArtists] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendingShows = async () => {
      setIsLoadingShows(true)
      setError(null)
      try {
        // First, get the trending data from the materialized view
        const { data: trendingData, error: trendingError } = await supabase
          .from('trending_shows')
          .select('*')
          .order('trending_score', { ascending: false })
          .limit(12) // Increased for grid layout

        if (trendingError) {
          throw trendingError
        }

        if (!trendingData || trendingData.length === 0) {
          // Fallback to upcoming shows if no trending data
          const { data: fallbackShows, error: fallbackError } = await supabase
            .from('shows')
            .select(`
              id,
              date,
              title,
              view_count,
              artist:artists(
                id,
                name,
                image_url
              ),
              venue:venues(
                id,
                name,
                city
              )
            `)
            .eq('status', 'upcoming')
            .gte('date', new Date().toISOString())
            .order('view_count', { ascending: false })
            .limit(12)

          if (fallbackError) throw fallbackError

          const fallbackMapped: TrendingShow[] = (fallbackShows || []).map((show: any) => ({
            show: {
              id: show.id,
              date: show.date,
              title: show.title,
              artist: {
                id: show.artist?.id,
                name: show.artist?.name,
                imageUrl: show.artist?.image_url,
              },
              venue: {
                id: show.venue?.id,
                name: show.venue?.name,
                city: show.venue?.city,
              },
            },
            totalVotes: 0,
            uniqueVoters: 0,
            trendingScore: show.view_count || 0,
          }))

          setTrendingShows(fallbackMapped)
          return
        }

        // Extract unique show IDs
        const showIds = trendingData.map(t => t.show_id)

        // Fetch full show details with artist and venue info
        const { data: showsData, error: showsError } = await supabase
          .from('shows')
          .select(`
            id,
            date,
            title,
            artist:artists(
              id,
              name,
              image_url
            ),
            venue:venues(
              id,
              name,
              city
            )
          `)
          .in('id', showIds)

        if (showsError) {
          throw showsError
        }

        // Create a map of show details
        const showsMap = new Map(showsData.map((show: any) => [show.id, show]))

        // Combine trending data with show details
        const mappedData: TrendingShow[] = trendingData
          .map((trending: any) => {
            const show = showsMap.get(trending.show_id)
            if (!show) return null

            return {
              show: {
                id: show.id,
                date: show.date,
                title: show.title,
                artist: {
                  id: show.artist?.id,
                  name: show.artist?.name,
                  imageUrl: show.artist?.image_url,
                },
                venue: {
                  id: show.venue?.id,
                  name: show.venue?.name,
                  city: show.venue?.city,
                },
              },
              totalVotes: trending.total_votes,
              uniqueVoters: trending.unique_voters,
              trendingScore: trending.trending_score,
            }
          })
          .filter(Boolean) // Remove any null entries

        setTrendingShows(mappedData)
      } catch (err: any) {
        console.error('Error fetching trending shows:', err)
        setError(err.message || 'Failed to fetch shows.')
      } finally {
        setIsLoadingShows(false)
      }
    }

    const fetchFeaturedArtists = async () => {
      setIsLoadingArtists(true)
      try {
        // Get artists with upcoming shows
        const { data: artistsData, error: artistsError } = await supabase
          .from('artists')
          .select(`
            id,
            name,
            slug,
            image_url,
            genres,
            shows!inner(
              id,
              status,
              date
            )
          `)
          .eq('shows.status', 'upcoming')
          .gte('shows.date', new Date().toISOString())
          .order('followers', { ascending: false })
          .limit(6)

        if (artistsError) {
          throw artistsError
        }

        // Transform data for featured artists
        const featuredData: FeaturedArtist[] = (artistsData || []).map(artist => ({
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          imageUrl: artist.image_url,
          genres: artist.genres,
          upcomingShowsCount: artist.shows?.length || 0,
        }))

        setFeaturedArtists(featuredData)
      } catch (err: any) {
        console.error('Error fetching featured artists:', err)
      } finally {
        setIsLoadingArtists(false)
      }
    }

    fetchTrendingShows()
    fetchFeaturedArtists()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-headline font-bold mb-8 gradient-text leading-tight">
            Vote on the setlists<br />you want to hear.
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto font-body leading-relaxed">
            Help shape the setlist for upcoming concerts by voting on the songs you want to hear most
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/shows"
              className="btn-primary text-lg px-10 py-4"
            >
              Discover Shows
            </Link>
            <Link
              href="/artists"
              className="btn-secondary text-lg px-10 py-4"
            >
              Find Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Shows Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-headline font-bold mb-4 gradient-text">Trending Shows</h2>
              <p className="text-muted-foreground text-lg font-body">
                The hottest shows based on voting activity and engagement
              </p>
            </div>
            <Link
              href="/shows"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300"
            >
              View all →
            </Link>
          </div>
          
          {error && <p className="text-destructive text-center font-body mb-8">{error}</p>}
          <ShowCardGrid shows={trendingShows} isLoading={isLoadingShows} />
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-headline font-bold mb-4 gradient-text">Featured Artists</h2>
              <p className="text-muted-foreground text-lg font-body">
                Top artists with upcoming shows to vote on
              </p>
            </div>
            <Link
              href="/artists"
              className="text-primary font-headline font-semibold hover:gradient-text transition-all duration-300"
            >
              View all →
            </Link>
          </div>
          
          <FeaturedArtists artists={featuredArtists} isLoading={isLoadingArtists} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-headline font-bold text-center mb-16 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">1</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">Find a Show</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Search for upcoming concerts from your favorite artists
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">2</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">Vote for Songs</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Cast your votes for the songs you want to hear live
              </p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 glass mx-auto mb-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <span className="text-2xl font-headline font-bold gradient-text">3</span>
              </div>
              <h3 className="text-2xl font-headline font-semibold mb-4 text-foreground">See Results</h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Watch in real-time as votes come in and influence the setlist
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-black via-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to influence your favorite concerts?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of fans voting on setlists for upcoming shows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Free
            </Link>
            <Link
              href="/shows"
              className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors duration-200"
            >
              Browse Shows
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}