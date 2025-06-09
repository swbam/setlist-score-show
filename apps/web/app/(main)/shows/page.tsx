'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_SHOWS } from '@/lib/graphql/queries'
import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Show {
  id: string
  date: string
  title: string
  status: string
  ticketmasterUrl?: string
  viewCount: number
  artist: {
    id: string
    name: string
    slug: string
    imageUrl?: string
  }
  venue: {
    id: string
    name: string
    city: string
    state?: string
    country: string
  }
}

interface ShowsResponse {
  shows: Show[]
}

export default function ShowsPage() {
  const client = useGraphQLClient()

  const { data, isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: async () => {
      return client.request(GET_SHOWS, {
        limit: 20,
        status: 'upcoming'
      }) as Promise<ShowsResponse>
    }
  })

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Upcoming Shows</h1>
        
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !data?.shows?.length ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No upcoming shows found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.shows.map((show) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="gradient-card rounded-lg p-6 border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover"
              >
                <div className="flex flex-col h-full">
                  <h2 className="text-xl font-bold mb-2">{show.artist.name}</h2>
                  
                  <div className="space-y-2 text-sm text-gray-400 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{show.venue.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(show.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {show.venue.city && (
                      <div className="text-gray-500">
                        {show.venue.city}, {show.venue.state || show.venue.country}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                    <span className="text-sm text-gray-500">
                      {show.viewCount || 0} views
                    </span>
                    <span className="text-sm font-medium text-teal-400">
                      Vote Now →
                    </span>
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