import Link from 'next/link'
import { Calendar, MapPin, TrendingUp } from 'lucide-react'

interface Show {
  id: string
  date: string
  title?: string
  artist: {
    id: string
    name: string
    imageUrl?: string
  }
  venue: {
    id: string
    name: string
    city: string
  }
}

interface TrendingShow {
  show: Show
  totalVotes: number
  uniqueVoters: number
  trendingScore: number
}

interface ShowCardGridProps {
  shows: TrendingShow[]
  isLoading?: boolean
}

export function ShowCardGrid({ shows, isLoading }: ShowCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base h-64 sm:h-72 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!shows.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-xl font-body">No trending shows at the moment.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shows.map((item) => (
        <Link
          key={item.show.id}
          href={`/shows/${item.show.id}`}
          className="card-base overflow-hidden group"
        >
          {/* Artist Image - Much smaller height */}
          <div className="aspect-[16/9] sm:aspect-[3/2] relative bg-muted overflow-hidden">
            {item.show.artist.imageUrl ? (
              <img
                src={item.show.artist.imageUrl}
                alt={item.show.artist.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-headline font-bold text-muted-foreground/50">
                  {item.show.artist.name.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Trending Badge */}
            {item.trendingScore > 10 && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-primary text-primary-foreground px-2 sm:px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Trending</span>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-40" />
          </div>

          {/* Show Info */}
          <div className="p-3 sm:p-4">
            {/* Artist Name - Main Headline */}
            <h3 className="text-base sm:text-lg font-headline font-bold mb-1 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
              {item.show.artist.name}
            </h3>
            
            {/* Tour Name - Subheadline (if exists) */}
            {item.show.title && (
              <h4 className="text-xs sm:text-sm font-headline font-medium mb-2 sm:mb-3 text-muted-foreground line-clamp-1">
                {item.show.title}
              </h4>
            )}
            
            {/* Venue & Date */}
            <div className="space-y-1 text-xs text-muted-foreground font-body mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="font-medium line-clamp-1">{item.show.venue.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="font-medium">
                  {new Date(item.show.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="text-muted-foreground/70 font-medium pl-5 line-clamp-1">
                {item.show.venue.city}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-xs text-muted-foreground font-body">
                {item.totalVotes} votes
              </span>
              <span className="text-xs font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300">
                Vote Now →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 