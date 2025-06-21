'use client'

import Link from 'next/link'
import { Music, Calendar, Users, MapPin, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

interface ArtistCardProps {
  artist: {
    id: string
    name: string
    slug: string
    image_url: string | null
    genres?: string[]
    upcoming_shows?: number
    upcoming_shows_count?: number
    popularity?: number
    followers?: number
    next_show_date?: string | null
    tour_cities?: string[]
  }
  index?: number
  showStats?: boolean
}

export function ArtistCard({ artist, index = 0, showStats = false }: ArtistCardProps) {
  const upcomingShows = artist.upcoming_shows || artist.upcoming_shows_count || 0
  const isHot = artist.popularity && artist.popularity > 80
  const isTrending = upcomingShows > 3
  
  const formatNextShowDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays <= 7) return `${diffInDays}d`
    if (diffInDays <= 30) return `${Math.ceil(diffInDays / 7)}w`
    return `${Math.ceil(diffInDays / 30)}m`
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: "easeOut"
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <Link href={`/artists/${artist.slug}`} className="block">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-border">
          {artist.image_url ? (
            <>
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/70 transition-colors duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Music className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Enhanced badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {isHot && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="bg-secondary text-secondary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-border"
              >
                🔥 HOT
              </motion.div>
            )}
            
            {isTrending && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-border"
              >
                📈 TRENDING
              </motion.div>
            )}
          </div>
          
          {/* Enhanced content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2 drop-shadow-lg group-hover:text-muted-foreground transition-colors">
                {artist.name}
              </h3>
              
              {showStats && (
                <div className="space-y-1.5">
                  {/* Show count and next show */}
                  {upcomingShows > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-foreground/90">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {upcomingShows} {upcomingShows === 1 ? 'show' : 'shows'}
                        </span>
                      </div>
                      {artist.next_show_date && (
                        <div className="text-foreground/80 font-medium">
                          {formatNextShowDate(artist.next_show_date)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Followers */}
                  {artist.followers && artist.followers > 1000 && (
                    <div className="flex items-center gap-1.5 text-foreground/80 text-sm">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {artist.followers > 1000000 
                          ? `${(artist.followers / 1000000).toFixed(1)}M` 
                          : `${(artist.followers / 1000).toFixed(0)}K`} followers
                      </span>
                    </div>
                  )}
                  
                  {/* Tour cities preview */}
                  {artist.tour_cities && artist.tour_cities.length > 0 && (
                    <div className="flex items-center gap-1.5 text-foreground/70 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {artist.tour_cities.slice(0, 2).join(', ')}
                        {artist.tour_cities.length > 2 && ` +${artist.tour_cities.length - 2}`}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Genres */}
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {artist.genres.slice(0, 2).map((genre) => (
                    <Badge 
                      key={genre} 
                      variant="secondary" 
                      className="text-xs bg-muted/20 text-foreground border-border hover:bg-muted/30 transition-colors"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>
    </motion.div>
  )
}