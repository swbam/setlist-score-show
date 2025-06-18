'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar, Activity, Music, Users, Vote, Clock } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import Link from 'next/link'

export default function ShowsPage() {
  const supabase = createClientComponentClient()

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['shows', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shows')
        .select(`
          id, date, title, status, view_count,
          artist:artists(id, name, slug, image_url),
          venue:venues(id, name, city, state, country),
          setlists(setlist_songs(vote_count))
        `)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(60)

      if (error) throw error

      return (data || []).map((show: any) => {
        const totalVotes = show.setlists?.reduce((sum: number, sl: any) =>
          sum + (sl.setlist_songs?.reduce((acc: number, s: any) => acc + (s.vote_count || 0), 0) || 0)
        , 0) || 0

        return {
          id: show.id,
          date: show.date,
          title: show.title || `${show.artist?.name} at ${show.venue?.name}`,
          viewCount: show.view_count || 0,
          artist: {
            id: show.artist?.id,
            name: show.artist?.name,
            slug: show.artist?.slug,
            imageUrl: show.artist?.image_url
          },
          venue: {
            id: show.venue?.id,
            name: show.venue?.name,
            city: show.venue?.city,
            state: show.venue?.state,
            country: show.venue?.country
          },
          totalVotes
        }
      })
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
            <span>Upcoming Shows</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body">
            All upcoming concerts available for setlist voting
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <p>Loading…</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {shows.map((show: any) => (
                  <ShowCard key={show.id} show={{
                    id: show.id,
                    date: show.date,
                    title: show.title,
                    status: 'upcoming',
                    artist: show.artist,
                    venue: show.venue,
                    _count: { votes: show.totalVotes },
                    viewCount: show.viewCount
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Quick Filters & Stats */}
          <div className="w-full lg:w-80 space-y-4 sm:space-y-6 order-first lg:order-last">
            <ShowsSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

// Shows Sidebar Component
function ShowsSidebar() {
  const stats = {
    totalShows: 156,
    thisWeek: 24,
    thisMonth: 89,
    votableShows: 134
  }

  const filters = [
    { name: 'This Week', count: 24, href: '/shows?filter=this-week' },
    { name: 'This Month', count: 89, href: '/shows?filter=this-month' },
    { name: 'By Genre', count: 12, href: '/shows?filter=genre' },
    { name: 'By Location', count: 45, href: '/shows?filter=location' }
  ]

  return (
    <>
      {/* Quick Stats */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Show Stats
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.totalShows}</div>
            <div className="text-xs text-muted-foreground">Total Shows</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.thisWeek}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.thisMonth}</div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">{stats.votableShows}</div>
            <div className="text-xs text-muted-foreground">Votable</div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Quick Filters
        </h3>
        
        <div className="space-y-2 sm:space-y-3">
          {filters.map((filter) => (
            <Link
              key={filter.name}
              href={filter.href}
              className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                  {filter.name}
                </div>
              </div>
              <div className="text-xs bg-muted/40 text-muted-foreground px-2 py-1 rounded-full">
                {filter.count}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground">Quick Actions</h3>
        
        <div className="space-y-2 sm:space-y-3">
          <Link 
            href="/trending" 
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                View Trending
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Hottest shows right now
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
                Browse Artists
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Find your favorite artists
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}