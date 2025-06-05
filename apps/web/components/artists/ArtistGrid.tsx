import Link from 'next/link'
import Image from 'next/image'
import { Users, Calendar } from 'lucide-react'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl?: string
  genres?: string[]
  popularity?: number
  followers?: number
}

interface ArtistGridProps {
  artists: Artist[]
}

export function ArtistGrid({ artists }: ArtistGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {artists.map((artist) => (
        <Link
          key={artist.id}
          href={`/artists/${artist.slug}`}
          className="group gradient-card rounded-lg overflow-hidden border border-gray-800 hover:border-teal-500/30 transition-all duration-300 card-hover"
        >
          {/* Artist Image */}
          <div className="aspect-square relative bg-gray-800 overflow-hidden">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-16 h-16 text-gray-600" />
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
          </div>

          {/* Artist Info */}
          <div className="p-4">
            <h3 className="font-bold text-lg mb-2 group-hover:text-teal-400 transition-colors">
              {artist.name}
            </h3>
            
            {artist.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.genres.slice(0, 2).map((genre, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-400"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-400">
              {artist.followers && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(artist.followers)} followers</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-teal-400">View Shows</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}