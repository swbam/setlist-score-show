import { Music, Users, TrendingUp, Search } from 'lucide-react'
import Link from 'next/link'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { createClient } from '@supabase/supabase-js'
import { ArtistsPageClient } from '@/components/artists/ArtistsPageClient'

// This page uses dynamic data and should not be statically generated
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtistsPage() {
  // Use createClient for public data access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Get artists data first (avoiding complex joins)
    const { data: artistsData, error: artistsError } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        slug,
        image_url,
        genres,
        followers,
        popularity
      `)
      .order('popularity', { ascending: false })
      .limit(100)

    if (artistsError) {
      console.error('Error fetching artists:', artistsError)
    }

    // Get show counts for each artist separately
    let artistsWithCounts: any[] = []
    if (artistsData && artistsData.length > 0) {
      const artistIds = artistsData.map(artist => artist.id)
      
      // Get show counts per artist
      const { data: showCounts, error: showCountsError } = await supabase
        .from('shows')
        .select('artist_id, status, date')
        .in('artist_id', artistIds)

      if (showCountsError) {
        console.error('Error fetching show counts:', showCountsError)
      }

      // Process show counts
      const showCountMap = new Map<string, { total: number; upcoming: number }>()
      showCounts?.forEach(show => {
        if (!showCountMap.has(show.artist_id)) {
          showCountMap.set(show.artist_id, { total: 0, upcoming: 0 })
        }
        const counts = showCountMap.get(show.artist_id)!
        counts.total++
        if (show.status === 'upcoming' && new Date(show.date) > new Date()) {
          counts.upcoming++
        }
      })

      // Combine artist data with show counts
      artistsWithCounts = artistsData.map(artist => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.image_url,
        genres: artist.genres || [],
        followers: artist.followers || 0,
        popularity: artist.popularity || 0,
        showCount: showCountMap.get(artist.id)?.total || 0,
        upcomingShows: showCountMap.get(artist.id)?.upcoming || 0
      }))
    }

    // Calculate stats
    const stats = {
      totalArtists: artistsWithCounts.length,
      artistsWithUpcomingShows: artistsWithCounts.filter(a => a.upcomingShows > 0).length,
      totalShows: artistsWithCounts.reduce((sum, artist) => sum + artist.showCount, 0)
    }

    // Calculate top genres
    const genreCount: Record<string, number> = {}
    artistsWithCounts.forEach(artist => {
      artist.genres?.forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
    })

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }))

    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
          {/* Header */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              <span>All Artists</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body">
              Discover artists and vote on their upcoming setlists
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content - Pass data to client component for interactivity */}
            <div className="flex-1 min-w-0">
              <ArtistsPageClient artists={artistsWithCounts} />
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-4 sm:space-y-6 order-first lg:order-last">
              <ArtistsSidebar stats={stats} topGenres={topGenres} />
            </div>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error in artists page:', error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Artists</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }
}

// Artists Sidebar Component (Server Component)
function ArtistsSidebar({ stats, topGenres }: { 
  stats: { totalArtists: number; artistsWithUpcomingShows: number; totalShows: number }
  topGenres: { genre: string; count: number }[]
}) {
  return (
    <>
      {/* Quick Stats */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Artist Stats
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">
              {stats.totalArtists}
            </div>
            <div className="text-xs text-muted-foreground">Total Artists</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">
              {stats.artistsWithUpcomingShows}
            </div>
            <div className="text-xs text-muted-foreground">With Upcoming Shows</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">
              {stats.totalShows}
            </div>
            <div className="text-xs text-muted-foreground">Total Shows</div>
          </div>
        </div>
      </div>

      {/* Top Genres */}
      <div className="card-base p-4 sm:p-6">
        <h3 className="text-lg font-headline font-bold mb-4 text-foreground">Popular Genres</h3>
        <div className="space-y-2">
          {topGenres.map(({ genre, count }) => (
            <div key={genre} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium capitalize">{genre}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {count} artists
              </span>
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
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                Browse Shows
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">Find upcoming concerts</div>
            </div>
          </Link>
          <Link 
            href="/trending"
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-foreground group-hover:gradient-text transition-all">
                View Trending
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">Hottest shows right now</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}