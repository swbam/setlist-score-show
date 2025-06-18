'use client'

import Link from 'next/link'
import { Music } from 'lucide-react'
import { motion } from 'framer-motion'

interface ArtistCardProps {
  artist: {
    id: string
    name: string
    slug: string
    image_url: string | null
    genres?: string[]
    upcoming_shows_count?: number
    popularity?: number
  }
  index?: number
}

export function ArtistCard({ artist, index = 0 }: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/artists/${artist.slug}`}
        className="group block"
      >
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-lg group-hover:shadow-xl transition-all duration-300">
          {artist.image_url ? (
            <>
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-16 h-16 text-gray-400 dark:text-gray-600" />
            </div>
          )}
          
          {/* Popularity badge */}
          {artist.popularity && artist.popularity > 80 && (
            <div className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm text-black text-xs font-bold px-2 py-1 rounded-full">
              🔥 HOT
            </div>
          )}
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-lg line-clamp-1 drop-shadow-lg">
              {artist.name}
            </h3>
            {artist.upcoming_shows_count !== undefined && artist.upcoming_shows_count > 0 && (
              <p className="text-sm text-white/90 mt-1">
                {artist.upcoming_shows_count} upcoming {artist.upcoming_shows_count === 1 ? 'show' : 'shows'}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}