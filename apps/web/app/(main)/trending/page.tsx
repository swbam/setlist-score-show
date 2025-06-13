'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS } from '@/lib/graphql/queries'
import { TrendingUp } from 'lucide-react'
import { ShowCardGrid } from '@/components/shows/ShowCardGrid'

export default function TrendingPage() {
  const client = useGraphQLClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      return client.request(GET_TRENDING_SHOWS, { limit: 24 })
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
        title: show.title,
        artist: {
          id: show.artist?.id,
          name: show.artist?.name || 'Unknown Artist',
          imageUrl: show.artist?.imageUrl
        },
        venue: {
          id: show.venue?.id,
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

        {/* Trending Shows Grid */}
        <ShowCardGrid shows={trendingShows} isLoading={isLoading} />
      </div>
    </div>
  )
}