'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Music, Users, TrendingUp, Search } from 'lucide-react'
import Link from 'next/link'
import { ArtistCard } from '@/components/artists/ArtistCard'
import { useState } from 'react'

export default function ArtistsPage() {
  const supabase = createClientComponentClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id, name, slug, image_url, genres, followers, popularity,
          shows!inner(id, date, status)
        `)
        .order('popularity', { ascending: false })
        .limit(100)

      if (error) throw error

      return (data || []).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        slug: artist.slug,
        imageUrl: artist.image_url,
        genres: artist.genres || [],
        followers: artist.followers,
        popularity: artist.popularity,
        showCount: artist.shows?.length || 0,
        upcomingShows: artist.shows?.filter((show: any) => 
          show.status === 'upcoming' && new Date(show.date) > new Date()
        ).length || 0
      }))
    }
  })

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.genres.some((genre: string) => 
      genre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

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
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search artists by name or genre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Artists Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredArtists.map((artist: any) => (
                  <ArtistCard key={artist.id} artist={artist} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && filteredArtists.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No artists found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'No artists available yet'}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4 sm:space-y-6 order-first lg:order-last">
            <ArtistsSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}

// Artists Sidebar Component
function ArtistsSidebar() {
  const supabase = createClientComponentClient()

  const { data: stats } = useQuery({
    queryKey: ['artists', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, shows!inner(id, status, date)')

      if (error) throw error

      const totalArtists = data?.length || 0
      const artistsWithUpcomingShows = data?.filter(artist => 
        artist.shows.some((show: any) => 
          show.status === 'upcoming' && new Date(show.date) > new Date()
        )
      ).length || 0

      return {
        totalArtists,
        artistsWithUpcomingShows,
        totalShows: data?.reduce((sum, artist) => sum + artist.shows.length, 0) || 0
      }
    }
  })

  const { data: topGenres } = useQuery({
    queryKey: ['artists', 'genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('genres')
        .not('genres', 'is', null)

      if (error) throw error

      const genreCount: Record<string, number> = {}
      data?.forEach(artist => {
        artist.genres?.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      })

      return Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([genre, count]) => ({ genre, count }))
    }
  })

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
              {stats?.totalArtists || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Artists</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">
              {stats?.artistsWithUpcomingShows || 0}
            </div>
            <div className="text-xs text-muted-foreground">With Upcoming Shows</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl lg:text-2xl font-headline font-bold text-foreground">
              {stats?.totalShows || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Shows</div>
          </div>
        </div>
      </div>

      {/* Top Genres */}
      {topGenres && topGenres.length > 0 && (
        <div className="card-base p-4 sm:p-6">
          <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Popular Genres
          </h3>
          
          <div className="space-y-2">
            {topGenres.map(({ genre, count }) => (
              <div key={genre} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate">
                  {genre}
                </span>
                <span className="text-xs bg-muted/40 text-muted-foreground px-2 py-1 rounded-full">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div className="text-xs text-muted-foreground hidden sm:block">
                Find upcoming concerts
              </div>
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
              <div className="text-xs text-muted-foreground hidden sm:block">
                Hottest shows right now
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}