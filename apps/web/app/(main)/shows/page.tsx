import { Calendar, Activity, Music, Users, Vote, Clock } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

// This page uses dynamic data and should not be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ShowsPage() {
  // Use createClient for public data access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get shows data first
    const { data: showsData, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        title,
        status,
        view_count,
        artist_id,
        venue_id
      `)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(60)

    if (showsError) {
      console.error('Error fetching shows:', showsError)
      return <div>Error loading shows</div>
    }

    if (!showsData || showsData.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
            <div className="text-center py-16">
              <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No upcoming shows found
              </h2>
              <p className="text-gray-500">
                Check back later for new concerts
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Get unique artist and venue IDs
    const artistIds = [...new Set(showsData.map(show => show.artist_id).filter(Boolean))]
    const venueIds = [...new Set(showsData.map(show => show.venue_id).filter(Boolean))]

    // Get artists and venues data separately
    const [{ data: artists }, { data: venues }] = await Promise.all([
      supabase
        .from('artists')
        .select('id, name, slug, image_url')
        .in('id', artistIds),
      supabase
        .from('venues')
        .select('id, name, city, state, country')
        .in('id', venueIds)
    ])

    // Create lookup maps for quick access
    const artistsMap = new Map(artists?.map(a => [a.id, a]) || [])
    const venuesMap = new Map(venues?.map(v => [v.id, v]) || [])

    // Process shows data
    const processedShows = showsData.map(show => {
      const artist = artistsMap.get(show.artist_id)
      const venue = venuesMap.get(show.venue_id)

      return {
        id: show.id,
        date: show.date,
        title: show.title || `${artist?.name || 'Unknown Artist'} at ${venue?.name || 'Unknown Venue'}`,
        status: show.status,
        viewCount: show.view_count || 0,
        artist: artist ? {
          id: artist.id,
          name: artist.name,
          slug: artist.slug,
          imageUrl: artist.image_url
        } : null,
        venue: venue ? {
          id: venue.id,
          name: venue.name,
          city: venue.city,
          state: venue.state,
          country: venue.country
        } : null,
        totalVotes: 0 // We'll get this from setlists later if needed
      }
    }).filter(show => show.artist && show.venue) // Only include shows with valid artist and venue

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
              All upcoming concerts available for setlist voting ({processedShows.length} shows)
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {processedShows.map((show) => (
                  <ShowCard 
                    key={show.id} 
                    show={{
                      id: show.id,
                      date: show.date,
                      title: show.title,
                      status: show.status,
                      artist: show.artist,
                      venue: show.venue,
                      _count: { votes: show.totalVotes },
                      viewCount: show.viewCount
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Sidebar - Quick Filters & Stats */}
            <div className="w-full lg:w-80 space-y-4 sm:space-y-6 order-first lg:order-last">
              <ShowsSidebar totalShows={processedShows.length} />
            </div>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error in ShowsPage:', error)
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Shows
            </h2>
            <p className="text-gray-500">
              Please try again later
            </p>
          </div>
        </div>
      </div>
    )
  }
}

// Shows Sidebar Component
function ShowsSidebar({ totalShows }: { totalShows: number }) {
  const stats = {
    totalShows,
    thisWeek: Math.floor(totalShows * 0.15), // Rough calculation
    thisMonth: Math.floor(totalShows * 0.6),
    votableShows: Math.floor(totalShows * 0.9)
  }

  const filters = [
    { name: 'This Week', count: stats.thisWeek, href: '/shows?filter=this-week' },
    { name: 'This Month', count: stats.thisMonth, href: '/shows?filter=this-month' },
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