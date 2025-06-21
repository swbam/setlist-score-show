'use client'

import Link from 'next/link'
import { Music, Users, Calendar, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  genres: string[]
  followers?: number
  popularity?: number
  showCount: number
  upcomingShows: number
}

interface ArtistCardProps {
  artist: Artist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Link href={`/artists/${artist.slug}`} className="group block">
      <div className="card-base p-4 sm:p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] h-full">
        {/* Artist Image */}
        <div className="flex justify-center mb-4">
          {artist.imageUrl ? (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border group-hover:border-primary/50 transition-colors">
              <Music className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Artist Name */}
        <h3 className="text-lg sm:text-xl font-headline font-bold text-center mb-2 text-foreground group-hover:gradient-text transition-all">
          {artist.name}
        </h3>

        {/* Genres */}
        {artist.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center mb-4">
            {artist.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs px-2 py-1">
                {genre}
              </Badge>
            ))}
            {artist.genres.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{artist.genres.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {/* Followers */}
          {artist.followers && (
            <div className="flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              <span>{formatFollowers(artist.followers)} followers</span>
            </div>
          )}

          {/* Popularity */}
          {artist.popularity && (
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{artist.popularity}% popularity</span>
            </div>
          )}

          {/* Shows */}
          <div className="flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {artist.upcomingShows > 0 
                ? `${artist.upcomingShows} upcoming show${artist.upcomingShows > 1 ? 's' : ''}`
                : `${artist.showCount} total show${artist.showCount !== 1 ? 's' : ''}`
              }
            </span>
          </div>
        </div>

        {/* Upcoming Shows Badge */}
        {artist.upcomingShows > 0 && (
          <div className="mt-3 text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              🎤 {artist.upcomingShows} upcoming
            </Badge>
          </div>
        )}
      </div>
    </Link>
  )
}