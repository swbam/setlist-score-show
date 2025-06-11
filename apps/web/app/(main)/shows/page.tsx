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
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-headline font-bold mb-12 gradient-text">Upcoming Shows</h1>
        
        {isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : !data?.shows?.length ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-xl font-body">No upcoming shows found.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {data.shows.map((show) => (
              <Link
                key={show.id}
                href={`/shows/${show.id}`}
                className="card-base p-8 group block"
              >
                <div className="flex flex-col h-full">
                  <h2 className="text-2xl font-headline font-bold mb-4 text-foreground group-hover:gradient-text transition-all duration-300">
                    {show.artist.name}
                  </h2>
                  
                  <div className="space-y-3 text-base text-muted-foreground mb-6 flex-1 font-body">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-accent" />
                      <span className="font-medium">{show.venue.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-accent" />
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
                      <div className="text-muted-foreground/70 font-medium">
                        {show.venue.city}, {show.venue.state || show.venue.country}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/30">
                    <span className="text-sm text-muted-foreground font-body">
                      {show.viewCount || 0} views
                    </span>
                    <span className="text-sm font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
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