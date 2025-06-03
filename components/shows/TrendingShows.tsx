'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ShowCard } from './ShowCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Flame } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export function TrendingShows() {
  const { data: trendingShows, isLoading } = useQuery({
    queryKey: ['trending-shows'],
    queryFn: async () => {
      // First, refresh the materialized view
      await supabase.rpc('refresh_materialized_view', { view_name: 'trending_shows' })

      // Then fetch trending shows
      const { data, error } = await supabase
        .from('trending_shows')
        .select(`
          show_id,
          artist_id,
          venue_id,
          show_date,
          show_name,
          show_status,
          view_count,
          total_votes,
          unique_voters,
          trending_score
        `)
        .order('trending_score', { ascending: false })
        .limit(10)

      if (error) throw error

      // Fetch related data
      const showIds = data?.map(t => t.show_id) || []
      const artistIds = [...new Set(data?.map(t => t.artist_id) || [])]
      const venueIds = [...new Set(data?.map(t => t.venue_id) || [])]

      const [artistsRes, venuesRes] = await Promise.all([
        supabase.from('artists').select('*').in('id', artistIds),
        supabase.from('venues').select('*').in('id', venueIds)
      ])

      const artistsMap = new Map(artistsRes.data?.map(a => [a.id, a]))
      const venuesMap = new Map(venuesRes.data?.map(v => [v.id, v]))

      // Transform to match ShowCard format
      return data?.map(trending => ({
        id: trending.show_id,
        date: trending.show_date,
        title: trending.show_name,
        status: trending.show_status,
        view_count: trending.view_count,
        artist: artistsMap.get(trending.artist_id) || { id: trending.artist_id, name: 'Unknown Artist' },
        venue: venuesMap.get(trending.venue_id) || { id: trending.venue_id, name: 'Unknown Venue', city: 'Unknown', country: 'Unknown' },
        _count: {
          votes: trending.total_votes
        },
        trending_score: trending.trending_score
      }))
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="gradient-text">Trending Shows</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 pb-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-80 h-64 bg-gray-800 flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trendingShows || trendingShows.length === 0) {
    return null
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
          <span className="gradient-text">Trending Shows</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {trendingShows.map((show, index) => (
              <div key={show.id} className="w-80 flex-shrink-0 relative">
                {index < 3 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="relative">
                      <Flame className={`w-8 h-8 ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        'text-orange-600'
                      } drop-shadow-lg`} />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                )}
                <ShowCard show={show} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}