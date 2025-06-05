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
        className="gradient-card rounded-lg p-6 border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover block"
      >
        <div className="flex items-start gap-6">
          {/* Artist Image */}
          {show.artist.imageUrl && (
            <img
              src={show.artist.imageUrl}
              alt={show.artist.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}

          {/* Show Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold mb-1">{show.artist.name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{show.venue.name}, {show.venue.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(show.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {showStats && (
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-teal-500" />
                  <span className="text-sm">
                    <span className="font-semibold">{show._count?.votes || 0}</span> votes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm">
                    <span className="font-semibold">{show.viewCount || 0}</span> views
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
            <span>{formatDate(show.date)}</span>
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
  )
}