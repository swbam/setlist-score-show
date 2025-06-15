import Link from 'next/link'
import { Calendar, MapPin, Users, Vote } from 'lucide-react'

export interface Show {
  id: string
  date: string
  title: string
  status: string
  ticketmasterUrl?: string
  viewCount: number
  trendingScore?: number
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
  _count?: {
    votes: number
  }
}

interface ShowCardProps {
  show: Show
  variant?: 'grid' | 'list'
  showStats?: boolean
}

export function ShowCard({ show, variant = 'grid', showStats = false }: ShowCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: variant === 'grid' ? 'short' : undefined,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (variant === 'list') {
    return (
      <Link
        href={`/shows/${show.id}`}
        className="card-base p-4 sm:p-6 block group relative"
      >
        {/* Trending Flame */}
        {show.trendingScore && show.trendingScore > 80 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-red-500 animate-pulse">
            <span className="text-sm font-bold">🔥</span>
            <span className="text-xs font-semibold">Trending</span>
          </div>
        )}
        <div className="flex items-start gap-4 sm:gap-6">
          {/* Artist Image */}
          {show.artist.imageUrl && (
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src={show.artist.imageUrl}
                alt={show.artist.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-border shadow-medium"
              />
            </div>
          )}

          {/* Show Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg sm:text-xl font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300">
                  {show.artist.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground font-body">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="font-medium">{show.venue.name}, {show.venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span className="font-medium">{formatDate(show.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-4 sm:gap-6 mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-primary" />
                  <span className="text-sm font-body">
                    <span className="font-bold text-foreground">{show._count?.votes || 0}</span> <span className="text-muted-foreground">votes</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-sm font-body">
                    <span className="font-bold text-foreground">{show.viewCount || 0}</span> <span className="text-muted-foreground">views</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/shows/${show.id}`}
      className="card-base p-4 group block relative"
    >
      {show.trendingScore && show.trendingScore > 80 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-red-500 animate-pulse">
          <span className="text-sm font-bold">🔥</span>
          <span className="text-xs font-semibold">Trending</span>
        </div>
      )}
      <div className="flex flex-col h-full">
        <h2 className="text-lg font-headline font-bold mb-3 text-foreground group-hover:gradient-text transition-all duration-300">
          {show.artist.name}
        </h2>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-1 font-body">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="font-medium">{show.venue.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="font-medium">{formatDate(show.date)}</span>
          </div>
          {show.venue.city && (
            <div className="text-muted-foreground/70 font-medium">
              {show.venue.city}, {show.venue.state || show.venue.country}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
          <span className="text-xs text-muted-foreground font-body">
            {show.viewCount || 0} views
          </span>
          <span className="text-xs font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
            Vote Now →
          </span>
        </div>
      </div>
    </Link>
  )
}