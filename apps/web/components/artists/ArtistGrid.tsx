import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar } from 'lucide-react'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  genres?: string[]
  popularity?: number
  followers?: number
}

interface ArtistGridProps {
  artists: Artist[]
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artists/${artist.slug}`}
          className="group card-base overflow-hidden"
        >
          {/* Artist Image - Much smaller height to match show cards */}
          <div className="aspect-[16/9] sm:aspect-[3/2] relative bg-muted overflow-hidden">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
          </div>

          {/* Artist Info */}
          <div className="p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-headline font-bold mb-1 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
              {artist.name}
            </h3>
            
            {/* Genres - More compact */}
            {artist.genres?.length > 0 && (
              <h4 className="text-xs sm:text-sm font-headline font-medium mb-2 sm:mb-3 text-muted-foreground line-clamp-1">
                {artist.genres.slice(0, 2).join(' • ')}
              </h4>
            )}

            {/* Stats & Actions */}
            <div className="space-y-1 text-xs text-muted-foreground font-body mb-2 sm:mb-3">
              {artist.followers && (
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-accent flex-shrink-0" />
                  <span className="font-medium line-clamp-1">{formatNumber(artist.followers)} followers</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="font-medium">View Shows</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}