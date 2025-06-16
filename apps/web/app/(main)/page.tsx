'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Calendar, Users, ArrowRight, Music, Play } from 'lucide-react'
import { ShowCard } from '@/components/shows/ShowCard'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export default function HomePage() {

  // Fetch trending shows
  const { data: trendingShows, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-shows'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_shows_limited', { limit_count: 6 })
      if (error) throw error

      return (
        data || []
      ).map((show: any) => ({
        id: show.show_id,
        date: show.date,
        title: show.title,
        trendingScore: show.trending_score,
        artist: {
          id: show.artist_id,
          name: show.artist_name,
          slug: show.artist_slug,
          imageUrl: show.artist_image_url,
        },
        venue: {
          id: show.venue_id,
          name: show.venue_name,
          city: show.venue_city,
        },
      }))
    },
    staleTime: 10 * 60 * 1000,
  })

  // Fetch featured artists
  const { data: featuredArtists, isLoading: loadingArtists } = useQuery({
    queryKey: ['featured-artists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          slug,
          image_url,
          genre
        `)
        .order('name')
        .limit(8)

      if (error) throw error
      return data || []
    },
    staleTime: 10 * 60 * 1000,
  })



  const genres = [
    { name: 'Rock/Alternative', id: 'rock' },
    { name: 'Pop', id: 'pop' },
    { name: 'Hip-Hop/Rap', id: 'hip-hop' },
    { name: 'Country', id: 'country' },
    { name: 'Electronic/Dance', id: 'electronic' },
    { name: 'R&B/Soul', id: 'rnb' },
    { name: 'Latin', id: 'latin' },
    { name: 'Jazz/Blues', id: 'jazz' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/60 to-black/80" />
        
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-10 lg:py-12">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-headline font-bold mb-3 text-white drop-shadow-lg">
              Crowdsourced Concert Setlists
              <span className="block gradient-text">by Real Fans</span>
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-6 max-w-xl mx-auto drop-shadow">
              Vote on songs, shape the show, and see what thousands of fans want to hear live
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/explore?tab=upcoming"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                Browse Upcoming Shows
              </Link>
              <button className="px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm font-semibold">
                How It Works
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <UnifiedSearch 
              placeholder="Search artists, venues, cities, or enter zip code..."
              className="[&_input]:bg-black/40 [&_input]:backdrop-blur-sm [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-white/60 [&_input]:focus:ring-primary/50 [&_input]:focus:border-primary/50 [&_svg]:text-white/60"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-10">
        
        {/* Trending This Week Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Trending This Week
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              The hottest shows fans are voting on right now
            </p>
          </div>
          
          {loadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-48" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {trendingShows?.slice(0, 6).map((show: any) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Artists Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Featured Artists
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Top artists with the most active setlist communities
            </p>
          </div>
          
          {loadingArtists ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-xl h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredArtists?.slice(0, 8).map((artist: any) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.slug}`}
                  className="group block p-3 rounded-xl bg-card hover:bg-card/80 transition-all duration-200 border border-border/50 hover:border-border hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover border border-border/50 mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate w-full">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {artist.genre || 'Music'}
                    </p>
                    <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors">
                      Vote Now
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Tours Section */}
        <section className="mb-8 lg:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text">
                Upcoming Tours
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Major tours hitting the road - help build their setlists
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-64 p-4 rounded-xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200"
              >
                <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Tour Name</h3>
                <p className="text-xs text-muted-foreground mb-2">2024 World Tour</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>25 shows</span>
                  <span>15 cities</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Genre-Based Discovery */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-headline font-bold gradient-text mb-2">
              Find Shows by Genre
            </h2>
            <p className="text-sm text-muted-foreground">
              Find shows by your favorite music style
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${genre.id}`}
                className="group p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 hover:border-border hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">
                    {genre.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}