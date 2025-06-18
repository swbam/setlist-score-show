import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MapPin, Calendar, Users, Music, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    zip: string
  }
}

interface NearbyShow {
  show_id: string
  show_name: string
  show_date: string
  artist_id: string
  artist_name: string
  artist_slug: string
  artist_image: string | null
  venue_id: string
  venue_name: string
  venue_city: string
  venue_state: string
  venue_capacity: number | null
  distance_km: number
  total_votes: number
}

export default async function NearbyShowsPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  // Validate ZIP
  if (!/^\d{5}$/.test(params.zip)) {
    notFound()
  }
  
  // Get ZIP info
  const { data: zipInfo } = await supabase
    .from('zip_codes')
    .select('city, state')
    .eq('zip_code', params.zip)
    .single()
  
  if (!zipInfo) {
    // ZIP code not in database, show helpful message
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ZIP Code Not Found
            </h1>
            <p className="text-gray-500 mb-8">
              We couldn't find information for ZIP code {params.zip}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // Get nearby shows
  const { data: shows, error } = await supabase.rpc('get_nearby_shows', {
    p_zip_code: params.zip,
    p_radius_km: 160 // ~100 miles
  }) as { data: NearbyShow[] | null, error: any }
  
  if (error) {
    console.error('Error fetching nearby shows:', error)
    return <div>Error loading shows</div>
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const formatDistance = (km: number) => {
    const miles = km * 0.621371
    return `${Math.round(miles)} mi`
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-8 h-8" />
              <h1 className="text-4xl font-bold">
                Shows Near {zipInfo.city}, {zipInfo.state}
              </h1>
            </div>
            <p className="text-xl opacity-90">
              {shows?.length || 0} upcoming concerts within 100 miles of {params.zip}
            </p>
          </div>
        </div>
      </div>
      
      {/* Shows Grid */}
      <div className="container mx-auto px-4 py-8">
        {!shows || shows.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No upcoming shows found
            </h2>
            <p className="text-gray-500 mb-8">
              Try searching a different area or check back later
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => (
              <Link
                key={show.show_id}
                href={`/shows/${show.show_id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Artist Image */}
                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {show.artist_image ? (
                    <img
                      src={show.artist_image}
                      alt={show.artist_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Distance Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
                    {formatDistance(show.distance_km)}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {show.artist_name}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-1">
                    {show.venue_name}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(show.show_date)}
                    </div>
                    
                    {show.venue_capacity && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {show.venue_capacity.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Location */}
                  <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {show.venue_city}, {show.venue_state}
                  </div>
                  
                  {/* Vote Count */}
                  {show.total_votes > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Community Votes
                        </span>
                        <span className="text-sm font-semibold text-teal-600">
                          {show.total_votes}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: zipInfo } = await supabase
    .from('zip_codes')
    .select('city, state')
    .eq('zip_code', params.zip)
    .single()
  
  return {
    title: `Shows Near ${zipInfo?.city || params.zip} | TheSet`,
    description: `Find upcoming concerts and vote on setlists near ${zipInfo?.city}, ${zipInfo?.state}`
  }
}