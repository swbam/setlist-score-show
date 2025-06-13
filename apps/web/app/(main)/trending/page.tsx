'use client'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_TRENDING_SHOWS } from '@/lib/graphql/queries'
import { TrendingUp, Activity, Music, Users, Vote, Clock, Calendar } from 'lucide-react'
import { ShowCardGrid } from '@/components/shows/ShowCardGrid'
import Link from 'next/link'

export default function TrendingPage() {
  const client = useGraphQLClient()

  const { data, isLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      return client.request(GET_TRENDING_SHOWS, { limit: 24 })
    }
  })

  const rawData = (data as any)?.trendingShows || (data as any) || []
  
  // Transform the data structure to match what the component expects
  const trendingShows = Array.isArray(rawData) ? rawData.map((show: any) => {
    // If it's already in the correct format, return as is
    if (show.show && show.totalVotes !== undefined) {
      return show
    }
    
    // Otherwise transform it
    return {
      show: {
        id: show.id,
        date: show.date,
        title: show.title,
        artist: {
          id: show.artist?.id,
          name: show.artist?.name || 'Unknown Artist',
          imageUrl: show.artist?.imageUrl
        },
        venue: {
          id: show.venue?.id,
          name: show.venue?.name || 'Unknown Venue',
          city: show.venue?.city || 'Unknown City'
        }
      },
      totalVotes: show.totalVotes || 0,
      uniqueVoters: show.uniqueVoters || 0,
      trendingScore: show.trendingScore || 0
    }
  }) : []

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            <span>Trending Shows</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body">
            The hottest shows based on voting activity and engagement
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content - Trending Shows Grid */}
          <div className="flex-1 min-w-0">
            <ShowCardGrid shows={trendingShows} isLoading={isLoading} />
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="w-full lg:w-80 space-y-4 sm:space-y-6 order-first lg:order-last">
            <RecentActivitySidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

// Recent Activity Sidebar Component
function RecentActivitySidebar() {
  // Mock data - in a real app, this would come from an API
  const recentVotes = [
    { id: 1, user: 'Alex M.', song: 'Bohemian Rhapsody', artist: 'Queen', timeAgo: '2m ago' },
    { id: 2, user: 'Sarah K.', song: 'Stairway to Heaven', artist: 'Led Zeppelin', timeAgo: '5m ago' },
    { id: 3, user: 'Mike R.', song: 'Sweet Child O Mine', artist: 'Guns N\' Roses', timeAgo: '8m ago' },
    { id: 4, user: 'Emma L.', song: 'Hotel California', artist: 'Eagles', timeAgo: '12m ago' },
    { id: 5, user: 'Josh T.', song: 'Thunderstruck', artist: 'AC/DC', timeAgo: '15m ago' },
  ]

  const recentSongs = [
    { id: 1, song: 'Mr. Brightside', artist: 'The Killers', addedBy: 'David W.', timeAgo: '3m ago' },
    { id: 2, song: 'Don\'t Stop Believin\'', artist: 'Journey', addedBy: 'Lisa P.', timeAgo: '7m ago' },
    { id: 3, song: 'Livin\' on a Prayer', artist: 'Bon Jovi', addedBy: 'Tom H.', timeAgo: '11m ago' },
    { id: 4, song: 'Sweet Caroline', artist: 'Neil Diamond', addedBy: 'Amy C.', timeAgo: '18m ago' },
  ]

  const stats = {
    totalVotesToday: 1247,
    activeFans: 89,
    songsAdded: 34,
    trendingShows: 12
  }

  return (
    <>
      {/* Real-time Stats */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Activity
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.totalVotesToday.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Votes Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.activeFans}</div>
            <div className="text-xs text-muted-foreground">Active Fans</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.songsAdded}</div>
            <div className="text-xs text-muted-foreground">Songs Added</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.trendingShows}</div>
            <div className="text-xs text-muted-foreground">Trending</div>
          </div>
        </div>
      </div>

      {/* Recent Votes */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <Vote className="w-5 h-5 text-primary" />
          Recent Votes
        </h3>
        
        <div className="space-y-2 sm:space-y-3">
          {recentVotes.map((vote) => (
            <div key={vote.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{vote.user.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {vote.song}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  by {vote.artist} • {vote.user}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                {vote.timeAgo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Song Additions */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Recently Added Songs
        </h3>
        
        <div className="space-y-2 sm:space-y-3">
          {recentSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Music className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {song.song}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  by {song.artist} • {song.addedBy}
                </div>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                {song.timeAgo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground">Quick Actions</h3>
        
        <div className="space-y-2 sm:space-y-3">
          <Link 
            href="/shows" 
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                Browse All Shows
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Find upcoming concerts
              </div>
            </div>
          </Link>
          
          <Link 
            href="/artists" 
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                Explore Artists
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Discover new music
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}