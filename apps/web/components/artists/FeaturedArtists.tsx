import Link from 'next/link'
import { Calendar, Users } from 'lucide-react'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  genres?: string[]
  upcomingShowsCount?: number
}

interface FeaturedArtistsProps {
  artists: Artist[]
  isLoading?: boolean
}

export function FeaturedArtists({ artists, isLoading }: FeaturedArtistsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="card-base h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!artists.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-xl font-body">No featured artists at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artists/${artist.slug}`}
          className="card-base overflow-hidden group"
        >
          {/* Artist Image */}
          <div className="aspect-square relative bg-muted overflow-hidden">
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                <Users className="w-12 h-12 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-80" />
          </div>

          {/* Artist Info */}
          <div className="p-4">
            {/* Artist Name */}
            <h3 className="text-lg font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-2">
              {artist.name}
            </h3>
            
            {/* Genres */}
            {artist.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.genres.slice(0, 2).map((genre, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-muted/60 rounded-full text-muted-foreground font-body"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Shows Count */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground font-body">
                <Calendar className="w-4 h-4 text-accent" />
                <span>
                  {artist.upcomingShowsCount || 0} {artist.upcomingShowsCount === 1 ? 'show' : 'shows'}
                </span>
              </div>
              <span className="text-primary font-headline font-semibold group-hover:gradient-text transition-all duration-300">
                View →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 