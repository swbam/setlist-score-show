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
          {/* Artist Image */}
          <div className="aspect-square relative bg-muted overflow-hidden">
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
          <div className="p-6">
            <h3 className="text-xl font-headline font-bold mb-3 text-foreground group-hover:gradient-text transition-all duration-300">
              {artist.name}
            </h3>
            
            {artist.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {artist.genres.slice(0, 2).map((genre, index) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 bg-muted/60 rounded-full text-muted-foreground font-body"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground font-body">
              {artist.followers && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="font-medium">{formatNumber(artist.followers)} followers</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">View Shows</span>
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