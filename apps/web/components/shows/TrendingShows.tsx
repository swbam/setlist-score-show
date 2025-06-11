import { TrendingUp, Users, Vote, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

interface TrendingShow {
  show: {
    id: string
    date: string
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
  totalVotes: number
  uniqueVoters: number
  trendingScore: number
}

interface TrendingShowsProps {
  shows: TrendingShow[]
  isLoading?: boolean
  limit?: number
  showRank?: boolean
}

export function TrendingShows({ 
  shows, 
  isLoading, 
  limit,
  showRank = true 
}: TrendingShowsProps) {
  const displayShows = limit ? shows.slice(0, limit) : shows

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(limit || 10)].map((_, i) => (
          <div key={i} className="gradient-card h-40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!displayShows.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-xl font-body">No trending shows at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {displayShows.map((item, index) => (
        <Link
          key={item.show.id}
          href={`/shows/${item.show.id}`}
          className="card-base p-8 block group"
        >
          <div className="flex items-start gap-8">
            {/* Show Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-headline font-bold mb-3 text-foreground group-hover:gradient-text transition-all duration-300">
                    {item.show.artist.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground font-body">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-accent" />
                      <span className="font-medium">{item.show.venue.name}, {item.show.venue.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-accent" />
                      <span className="font-medium">
                        {new Date(item.show.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Artist Image */}
                {item.show.artist.imageUrl && (
                  <div className="transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={item.show.artist.imageUrl}
                      alt={item.show.artist.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-border shadow-medium"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}