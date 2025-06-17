import Link from 'next/link'
import { Calendar, MapPin, Users, Star, TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Show {
  id: string
  date: string
  title: string
  status?: string
  ticketmasterUrl?: string
  viewCount?: number
  trendingScore?: number
  totalVotes?: number
  uniqueVoters?: number
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
    country?: string
  }
  _count?: {
    votes: number
  }
}

interface ShowCardProps {
  show: Show
  variant?: 'grid' | 'list' | 'featured'
  showStats?: boolean
  className?: string
}

export function ShowCard({ show, variant = 'grid', showStats = false, className }: ShowCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: variant === 'list' ? 'short' : undefined,
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isHot = show.trendingScore && show.trendingScore > 80

  if (variant === 'featured') {
    return (
      <Link
        href={`/shows/${show.id}`}
        className={cn("group relative block", className)}
      >
        <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-xl rounded-[2px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-white/10 h-full">
          {/* Hot badge */}
          {isHot && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Hot
            </div>
          )}
          
          {/* Artist image background */}
          {show.artist.imageUrl && (
            <div className="absolute inset-0 opacity-30">
              <img
                src={show.artist.imageUrl}
                alt={show.artist.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
            </div>
          )}
          
          {/* Content */}
          <div className="relative p-6 h-full flex flex-col">
            {/* Artist image */}
            <div className="mb-4">
              {show.artist.imageUrl ? (
                <img
                  src={show.artist.imageUrl}
                  alt={show.artist.name}
                  className="w-20 h-20 rounded-[2px] object-cover border-2 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-20 h-20 rounded-[2px] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-2 border-white/20">
                  <span className="text-2xl font-bold text-white/60">{show.artist.name.charAt(0)}</span>
                </div>
              )}
            </div>
            
            {/* Show info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                {show.artist.name}
              </h3>
              <div className="space-y-1.5 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="truncate">{show.venue.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(show.date)}</span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-semibold">{show.totalVotes || show._count?.votes || 0}</span>
                  <span className="text-gray-400">votes</span>
                </div>
                {show.uniqueVoters !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-white font-semibold">{show.uniqueVoters}</span>
                    <span className="text-gray-400">fans</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'list') {
    return (
      <Link
        href={`/shows/${show.id}`}
        className={cn(
          "group relative block bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur-xl rounded-[2px]",
          "border border-white/10 hover:border-white/20 transition-all duration-300",
          "hover:transform hover:scale-[1.02] hover:shadow-xl hover:shadow-white/5",
          className
        )}
      >
        {/* Hot indicator */}
        {isHot && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-red-500/30">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400">Trending</span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Artist Image */}
            {show.artist.imageUrl ? (
              <div className="flex-shrink-0">
                <img
                  src={show.artist.imageUrl}
                  alt={show.artist.name}
                  className="w-16 h-16 rounded-[2px] object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-16 rounded-[2px] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
                <span className="text-xl font-bold text-white/60">{show.artist.name.charAt(0)}</span>
              </div>
            )}

            {/* Show Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-200 transition-colors">
                {show.artist.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-300">{show.venue.name}, {show.venue.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-300">{formatDate(show.date)}</span>
                </div>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">
                      <span className="font-bold text-white">{show._count?.votes || 0}</span>
                      <span className="text-gray-400 ml-1">votes</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      <span className="font-bold text-white">{show.viewCount || 0}</span>
                      <span className="text-gray-400 ml-1">views</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center">
              <div className="text-white/60 group-hover:text-white transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid variant (default)
  return (
    <Link
      href={`/shows/${show.id}`}
      className={cn(
        "group relative block bg-gradient-to-b from-gray-900/60 to-gray-900/30 backdrop-blur-xl rounded-[2px]",
        "border border-white/10 hover:border-white/20 transition-all duration-300",
        "hover:transform hover:scale-105 hover:shadow-xl hover:shadow-white/5",
        "h-full",
        className
      )}
    >
      {/* Hot badge */}
      {isHot && (
        <div className="absolute top-3 right-3 z-10 p-1.5 rounded-[2px] bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-red-500/30">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
        </div>
      )}
      
      <div className="p-5 flex flex-col h-full">
        {/* Artist & Title */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gray-200 transition-colors line-clamp-1">
            {show.artist.name}
          </h3>
          {show.title && (
            <p className="text-sm text-gray-400 line-clamp-1">{show.title}</p>
          )}
        </div>
        
        {/* Venue & Date */}
        <div className="space-y-2 text-sm text-gray-400 mb-4 flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-300 truncate">{show.venue.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-300">{formatDate(show.date)}</span>
          </div>
          {show.venue.city && (
            <div className="text-gray-500 text-xs font-medium">
              {show.venue.city}{show.venue.state ? `, ${show.venue.state}` : ''}{show.venue.country && show.venue.country !== 'US' ? `, ${show.venue.country}` : ''}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400">
              <span className="font-semibold text-white">{show._count?.votes || 0}</span> votes
            </span>
            {show.viewCount !== undefined && (
              <span className="text-gray-400">
                <span className="font-semibold text-white">{show.viewCount}</span> views
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
            Vote
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}