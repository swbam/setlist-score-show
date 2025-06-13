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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold mb-4 sm:mb-6 gradient-text flex items-center gap-3 sm:gap-4">
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" />
            Trending Shows
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg lg:text-xl font-body">
            The hottest shows based on voting activity and engagement
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content - Trending Shows Grid */}
          <div className="flex-1">
            <ShowCardGrid shows={trendingShows} isLoading={isLoading} />
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="w-full lg:w-80 space-y-6">
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
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-headline font-bold text-foreground">{stats.totalVotesToday.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Votes Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-headline font-bold text-foreground">{stats.activeFans}</div>
            <div className="text-xs text-muted-foreground">Active Fans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-headline font-bold text-foreground">{stats.songsAdded}</div>
            <div className="text-xs text-muted-foreground">Songs Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-headline font-bold text-foreground">{stats.trendingShows}</div>
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
        
        <div className="space-y-3">
          {recentVotes.map((vote) => (
            <div key={vote.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{vote.user.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {vote.song}
                </div>
                <div className="text-xs text-muted-foreground">
                  by {vote.artist} • voted by {vote.user}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
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
        
        <div className="space-y-3">
          {recentSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {song.song}
                </div>
                <div className="text-xs text-muted-foreground">
                  by {song.artist} • added by {song.addedBy}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {song.timeAgo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground">Quick Actions</h3>
        
        <div className="space-y-3">
          <Link 
            href="/shows" 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <Calendar className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                Browse All Shows
              </div>
              <div className="text-xs text-muted-foreground">
                Find upcoming concerts
              </div>
            </div>
          </Link>
          
          <Link 
            href="/artists" 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <Users className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                Explore Artists
              </div>
              <div className="text-xs text-muted-foreground">
                Discover new music
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}