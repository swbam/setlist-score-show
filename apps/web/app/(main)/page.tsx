'use client' // Add this line to make it a client component for data fetching and state

import Link from 'next/link'
import { useEffect, useState } from 'react' // Import useEffect and useState
import { supabase } from '@/lib/supabase' // Import supabase client
import { TrendingShows } from '@/components/shows/TrendingShows' // Import TrendingShows component

// Make sure the TrendingShow interface matches the one in TrendingShows.tsx
// Based on previous tool output for TrendingShows.tsx, the interface is:
interface TrendingShow {
  show: {
    id: string;
    date: string;
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

export default function HomePage() {
  const [trendingShows, setTrendingShows] = useState<TrendingShow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendingShows = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // First, get the trending data from the materialized view
        const { data: trendingData, error: trendingError } = await supabase
          .from('trending_shows')
          .select('*')
          .order('trending_score', { ascending: false })
          .limit(10)

        if (trendingError) {
          throw trendingError
        }

        if (!trendingData || trendingData.length === 0) {
          setTrendingShows([])
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
        const showsMap = new Map(showsData.map(show => [show.id, show]))

        // Combine trending data with show details
        const mappedData: TrendingShow[] = trendingData
          .map((trending: any) => {
            const show = showsMap.get(trending.show_id)
            if (!show) return null

            return {
              show: {
                id: show.id,
                date: show.date,
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
        
        // Fallback to showing regular upcoming shows if trending view fails
        try {
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
            .limit(10)

          if (fallbackError) throw fallbackError

          const fallbackMapped: TrendingShow[] = (fallbackShows || []).map(show => ({
            show: {
              id: show.id,
              date: show.date,
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
          setError('Using fallback data - trending view not available')
        } catch (fallbackErr: any) {
          setError(fallbackErr.message || 'Failed to fetch shows.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingShows()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            Vote on Concert Setlists
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Help shape the setlist for upcoming concerts by voting on the songs you want to hear most
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shows"
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200"
            >
              Browse Shows
            </Link>
            <Link
              href="/artists"
              className="px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
            >
              Find Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Shows Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Trending Shows</h2>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <TrendingShows shows={trendingShows} isLoading={isLoading} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find a Show</h3>
              <p className="text-gray-400">
                Search for upcoming concerts from your favorite artists
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Vote for Songs</h3>
              <p className="text-gray-400">
                Cast your votes for the songs you want to hear live
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">See Results</h3>
              <p className="text-gray-400">
                Watch in real-time as votes come in and influence the setlist
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
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