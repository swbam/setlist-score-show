import Link from 'next/link'
import { ShowCard } from '@/components/shows/ShowCard'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { HeroSection } from '@/components/home/HeroSection'
import { ArtistCard } from '@/components/home/ArtistCard'
import { TrendingUp, Calendar, Users, ArrowRight, Music, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default async function HomePage() {
  // Fetch directly from Supabase tables since cache might be empty
  const [artistsResult, showsResult] = await Promise.allSettled([
    supabase
      .from('artists')
      .select('*')
      .gte('popularity', 50)
      .order('popularity', { ascending: false })
      .limit(12),
    
    supabase
      .from('shows')
      .select(`
        *,
        artist:artists(*),
        venue:venues(*)
      `)
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(8)
  ])

  const topArtists = artistsResult.status === 'fulfilled' ? artistsResult.value.data || [] : []
  const topShows = showsResult.status === 'fulfilled' ? showsResult.value.data || [] : []

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Top Artists Section */}
        {topArtists.length > 0 && (
          <section className="mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                  Trending Artists
                </h2>
              </div>
              <Link 
                href="/artists"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topArtists.slice(0, 12).map((artist: any, index: number) => (
                <ArtistCard key={artist.id} artist={artist} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Top Shows Section */}
        {topShows.length > 0 && (
          <section className="mb-12 lg:mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-headline font-bold gradient-text">
                  Upcoming Shows
                </h2>
              </div>
              <Link 
                href="/shows"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {topShows.map((show: any) => (
                <ShowCard 
                  key={show.id} 
                  show={{
                    ...show,
                    totalVotes: 0 // We'll calculate this later
                  }} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {topArtists.length === 0 && topShows.length === 0 && (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-8">
              Start by importing artists and shows to populate the platform.
            </p>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}

        {/* Stats Section */}
        <section className="mt-12 lg:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{topArtists.length}</div>
            <div className="text-sm text-muted-foreground">Artists</div>
          </div>
          <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{topShows.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming Shows</div>
          </div>
          <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">5</div>
            <div className="text-sm text-muted-foreground">Cities</div>
          </div>
          <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground">Active Voters</div>
          </div>
        </section>
      </div>
    </div>
  )
}