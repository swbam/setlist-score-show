'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Vote, TrendingUp, DollarSign, ExternalLink, Music } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

export interface Show {
  id: string
  date: string
  title: string | null
  status: string
  ticketmaster_url?: string | null
  tickets_url?: string | null
  min_price?: number | null
  max_price?: number | null
  popularity?: number
  viewCount?: number
  trendingScore?: number
  totalVotes?: number
  songsVoted?: number
  artist: {
    id: string
    name: string
    slug: string
    image_url?: string | null
    imageUrl?: string | null // legacy support
  }
  venue: {
    id: string
    name: string
    city: string
    state?: string | null
    country?: string
    capacity?: number | null
  }
  _count?: {
    votes: number
  }
}

interface ShowCardProps {
  show: Show
  variant?: 'grid' | 'list'
  showStats?: boolean
  showEngagement?: boolean
  index?: number
}

export function ShowCard({ show, variant = 'grid', showStats = false, showEngagement = false, index = 0 }: ShowCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    const formatted = date.toLocaleDateString('en-US', {
      weekday: variant === 'grid' ? 'short' : undefined,
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
    
    if (diffInDays <= 7 && diffInDays > 0) {
      return `${formatted} (${diffInDays}d)`
    }
    
    return formatted
  }
  
  const formatPrice = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null
    if (min && max && min !== max) return `$${min}-${max}`
    return `$${min || max}`
  }
  
  const isHot = (show.totalVotes || 0) > 10 || (show.popularity || 0) > 80
  const isTrending = show.trendingScore && show.trendingScore > 80
  const hasTickets = show.ticketmaster_url || show.tickets_url
  const artistImage = show.artist.image_url || show.artist.imageUrl
  const showTitle = show.title || `${show.artist.name} Live`
  
  const daysUntilShow = Math.ceil((new Date(show.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  if (variant === 'list') {
    return (
      <Link
        href={`/shows/${show.id}`}
        className="card-base p-8 block group relative"
      >
        {/* Trending Flame */}
        {show.trendingScore && show.trendingScore > 80 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-red-500 animate-pulse">
            <span className="text-base font-bold">🔥</span>
            <span className="text-xs font-semibold">Trending</span>
          </div>
        )}
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
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <div className="relative">
        <Link
          href={`/shows/${show.id}`}
          className="block bg-white dark:bg-gray-800 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Enhanced header with artist image */}
          <div className="relative h-48 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 overflow-hidden">
            {artistImage ? (
              <>
                <img
                  src={artistImage}
                  alt={show.artist.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            
            {/* Enhanced badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {isTrending && (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-1"
                >
                  🔥 <span>HOT</span>
                </motion.div>
              )}
              
              {isHot && !isTrending && (
                <motion.div
                  initial={{ scale: 0, rotate: 10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" /> <span>POPULAR</span>
                </motion.div>
              )}
            </div>
            
            {/* Days until show */}
            {daysUntilShow <= 14 && daysUntilShow > 0 && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                {daysUntilShow === 1 ? 'Tomorrow' : `${daysUntilShow} days`}
              </div>
            )}
            
            {/* Price badge */}
            {formatPrice(show.min_price, show.max_price) && (
              <div className="absolute bottom-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {formatPrice(show.min_price, show.max_price)}
              </div>
            )}
          </div>
          
          {/* Enhanced content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {show.artist.name}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span className="font-medium truncate">
                    {show.venue.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">
                    {formatDate(show.date)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                  <span className="truncate">
                    {show.venue.city}, {show.venue.state || show.venue.country}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Enhanced engagement stats */}
            {showEngagement && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {show.totalVotes || 0}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Vote className="w-3 h-3" />
                      Votes
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {show.songsVoted || 0}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Music className="w-3 h-3" />
                      Songs
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Enhanced footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {show.venue.capacity && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{show.venue.capacity.toLocaleString()}</span>
                  </div>
                )}
                
                {hasTickets && (
                  <div className="flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tickets</span>
                  </div>
                )}
              </div>
              
              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors flex items-center gap-1">
                Vote Now
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}