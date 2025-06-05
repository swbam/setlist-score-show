import { TrendingUp, Users, Vote, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

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
      <div className="space-y-4">
        {[...Array(limit || 10)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (!displayShows.length) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">No trending shows at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayShows.map((item, index) => (
        <Link
          key={item.show.id}
          href={`/shows/${item.show.id}`}
          className="gradient-card rounded-lg p-6 border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover block"
        >
          <div className="flex items-start gap-6">
            {/* Rank */}
            {showRank && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold">{index + 1}</span>
                </div>
              </div>
            )}

            {/* Show Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold mb-1">{item.show.artist.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{item.show.venue.name}, {item.show.venue.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
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
                  <img
                    src={item.show.artist.imageUrl}
                    alt={item.show.artist.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-teal-500" />
                  <span className="text-sm">
                    <span className="font-semibold">{item.totalVotes}</span> votes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm">
                    <span className="font-semibold">{item.uniqueVoters}</span> voters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    Score: <span className="font-semibold">{item.trendingScore.toFixed(0)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}