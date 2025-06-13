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
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-6 sm:mb-8 lg:mb-10 gradient-text">Upcoming Shows</h1>
        
        {isLoading ? (
          <div className="space-y-4 sm:space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-base p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-6 sm:h-8 bg-muted rounded-lg mb-2 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-muted rounded-lg animate-pulse flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.shows?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl font-body">No upcoming shows found.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {data.shows.map((show) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="card-base p-4 sm:p-6 group block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Artist Image */}
                  <div className="flex-shrink-0">
                    {show.artist.imageUrl ? (
                      <img
                        src={show.artist.imageUrl}
                        alt={show.artist.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-headline font-bold text-muted-foreground">
                          {show.artist.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
                      {show.artist.name}
                    </h2>
                    
                    <div className="space-y-1 text-sm sm:text-base text-muted-foreground font-body">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="font-medium line-clamp-1">{show.venue.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="font-medium">
                          {new Date(show.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {show.venue.city && (
                        <div className="text-muted-foreground/70 font-medium text-sm pl-6">
                          {show.venue.city}, {show.venue.state || show.venue.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action & Stats */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 text-sm text-muted-foreground font-body">
                    <span className="hidden sm:block">
                      {show.viewCount || 0} views
                    </span>
                    <span className="font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300 whitespace-nowrap">
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