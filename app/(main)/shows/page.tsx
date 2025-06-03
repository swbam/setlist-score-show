'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ShowCard } from '@/components/shows/ShowCard'
import { TrendingShows } from '@/components/shows/TrendingShows'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, MapPin } from 'lucide-react'

interface Show {
  id: string
  date: string
  title: string
  status: string
  view_count: number
  artist: {
    id: string
    name: string
    image_url: string
  }
  venue: {
    id: string
    name: string
    city: string
    state: string
    country: string
  }
  _count?: {
    votes: number
  }
}

export default function ShowsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('upcoming')

  // Fetch shows with filters
  const { data: shows, isLoading } = useQuery({
    queryKey: ['shows', searchTerm, statusFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('shows')
        .select(`
          *,
          artist:artists(*),
          venue:venues(*),
          setlists(
            setlist_songs(
              votes(count)
            )
          )
        `)
        .order('date', { ascending: true })

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (dateFilter === 'upcoming') {
        query = query.gte('date', new Date().toISOString())
      } else if (dateFilter === 'past') {
        query = query.lt('date', new Date().toISOString())
      }

      if (searchTerm) {
        query = query.or(`artist.name.ilike.%${searchTerm}%,venue.name.ilike.%${searchTerm}%,venue.city.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate vote counts
      return data?.map(show => ({
        ...show,
        _count: {
          votes: show.setlists?.reduce((total, setlist) => 
            total + (setlist.setlist_songs?.reduce((setlistTotal, song) => 
              setlistTotal + (song.votes?.length || 0), 0) || 0), 0) || 0
        }
      }))
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Upcoming Shows</h1>
        <p className="text-gray-400">Vote for songs you want to hear at upcoming concerts</p>
      </div>

      {/* Trending Shows Section */}
      <div className="mb-12">
        <TrendingShows />
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by artist, venue, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 focus:border-teal-500"
          />
        </div>

        <div className="flex gap-4">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Shows Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 bg-gray-800" />
          ))}
        </div>
      ) : shows && shows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No shows found matching your criteria</p>
        </div>
      )}
    </div>
  )
}