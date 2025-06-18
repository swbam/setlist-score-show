import Link from 'next/link'
import Image from 'next/image'
import { Music, Calendar } from 'lucide-react'
import { HomepageArtist } from '@/lib/queries/homepage'

interface ArtistCardProps {
  artist: HomepageArtist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link 
      href={`/artists/${artist.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* Artist Image */}
      <div className="aspect-square relative overflow-hidden">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
            <Music className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Popularity Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium text-white">
          {artist.popularity}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Artist Name */}
        <div>
          <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
            {artist.name}
          </h3>
          
          {/* Genres */}
          {artist.genres.length > 0 && (
            <p className="text-xs text-gray-400 line-clamp-1">
              {artist.genres.slice(0, 2).join(', ')}
            </p>
          )}
        </div>

        {/* Show Count */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{artist.upcomingShows} upcoming shows</span>
          </div>
          
          {/* Visual indicator for popularity */}
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, Math.floor(artist.popularity / 20)))].map((_, i) => (
              <div
                key={i}
                className="w-1 h-3 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  )
}
