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
      <div className="space-y-4 sm:space-y-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-base p-4 sm:p-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-6 sm:h-8 bg-muted rounded-lg mb-2 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          </div>
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
    <div className="space-y-4 sm:space-y-6">
      {shows.map((item) => (
        <Link
          key={item.show.id}
          href={`/shows/${item.show.id}`}
          className="card-base p-4 sm:p-6 group block relative"
        >
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Artist Image - Left Side */}
            <div className="flex-shrink-0">
              {item.show.artist.imageUrl ? (
                <img
                  src={item.show.artist.imageUrl}
                  alt={item.show.artist.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-headline font-bold text-muted-foreground">
                    {item.show.artist.name.charAt(0)}
                  </span>
                </div>
              )}
              
              {/* Trending Badge */}
              {item.trendingScore > 10 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Trending</span>
                </div>
              )}
            </div>

            {/* Show Info - Center */}
            <div className="flex-1 min-w-0">
              {/* Artist Name - Main Headline */}
              <h3 className="text-xl sm:text-2xl font-headline font-bold mb-2 text-foreground group-hover:gradient-text transition-all duration-300 line-clamp-1">
                {item.show.artist.name}
              </h3>
              
              {/* Tour Name - Subheadline (if exists) */}
              {item.show.title && (
                <h4 className="text-sm sm:text-base font-headline font-medium mb-2 text-muted-foreground line-clamp-1">
                  {item.show.title}
                </h4>
              )}
              
              {/* Venue & Date */}
              <div className="space-y-1 text-sm sm:text-base text-muted-foreground font-body">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="font-medium line-clamp-1">{item.show.venue.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="font-medium">
                    {new Date(item.show.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {item.show.venue.city && (
                  <div className="text-muted-foreground/70 font-medium text-sm pl-6">
                    {item.show.venue.city}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vote Now - Bottom Right Corner */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground font-body">
                {item.totalVotes} votes
              </span>
              <span className="text-sm font-headline font-semibold text-primary group-hover:gradient-text transition-all duration-300 whitespace-nowrap">
                Vote Now →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 