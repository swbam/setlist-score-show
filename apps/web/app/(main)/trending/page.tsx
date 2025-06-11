'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS } from '@/lib/graphql/queries'
import { TrendingUp, Users, Vote, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function TrendingPage() {
  const client = useGraphQLClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      return client.request(GET_TRENDING_SHOWS, { limit: 20 })
    }
  })

  const rawData = (data as any)?.trendingShows || (data as any) || []
  
  // Transform the data structure to match what the component expects
  const trendingShows = Array.isArray(rawData) ? rawData.map((show: any) => {
    // If it's already in the correct format, return as is
    if (show.show && show.totalVotes !== undefined) {
      return show
    }
    
    // Otherwise transform it
    return {
      show: {
        id: show.id,
        date: show.date,
        artist: {
          name: show.artist?.name || 'Unknown Artist',
          imageUrl: show.artist?.imageUrl
        },
        venue: {
          name: show.venue?.name || 'Unknown Venue',
          city: show.venue?.city || 'Unknown City'
        }
      },
      totalVotes: show.totalVotes || 0,
      uniqueVoters: show.uniqueVoters || 0,
      trendingScore: show.trendingScore || 0
    }
  }) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-headline font-bold mb-6 gradient-text flex items-center gap-4">
            <TrendingUp className="w-10 h-10" />
            Trending Shows
          </h1>
          <p className="text-muted-foreground text-xl font-body">
            The hottest shows based on voting activity and engagement
          </p>
        </div>

        {/* Trending Shows List */}
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : !trendingShows.length ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-xl font-body">No trending shows at the moment.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {trendingShows.map((item: any, index: number) => (
              <Link
                key={item.show.id}
                href={`/shows/${item.show.id}`}
                className="card-base p-8 block group"
              >
                <div className="flex items-start gap-8">
                  {/* Show Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-headline font-bold mb-3 text-foreground group-hover:gradient-text transition-all duration-300">
                          {item.show.artist.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground font-body">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-accent" />
                            <span className="font-medium">{item.show.venue.name}, {item.show.venue.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" />
                            <span className="font-medium">
                              {new Date(item.show.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Artist Image */}
                      {item.show.artist.imageUrl && (
                        <div className="transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={item.show.artist.imageUrl}
                            alt={item.show.artist.name}
                            className="w-20 h-20 rounded-2xl object-cover border border-border shadow-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}