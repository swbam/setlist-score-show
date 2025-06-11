import Link from 'next/link'
import { Calendar, MapPin, Users, Vote } from 'lucide-react'

export interface Show {
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
        className="card-base p-8 block group"
      >
        <div className="flex items-start gap-8">
          {/* Artist Image */}
          {show.artist.imageUrl && (
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src={show.artist.imageUrl}
                alt={show.artist.name}
                className="w-20 h-20 rounded-2xl object-cover border border-border shadow-medium"
              />
            </div>
          )}

          {/* Show Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-headline font-bold mb-3 text-foreground group-hover:gradient-text transition-all duration-300">
                  {show.artist.name}
                </h3>
                <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground font-body">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    <span className="font-medium">{show.venue.name}, {show.venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    <span className="font-medium">{formatDate(show.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-8 mt-6 pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <Vote className="w-5 h-5 text-primary" />
                  <span className="text-base font-body">
                    <span className="font-bold text-foreground">{show._count?.votes || 0}</span> <span className="text-muted-foreground">votes</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent" />
                  <span className="text-base font-body">
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
            <span className="font-medium">{formatDate(show.date)}</span>
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
  )
}