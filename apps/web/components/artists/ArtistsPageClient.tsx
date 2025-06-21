'use client'

import { useState } from 'react'
import { Search, Music } from 'lucide-react'
import { ArtistCard } from '@/components/artists/ArtistCard'

interface Artist {
  id: string
  name: string
  slug: string
  imageUrl: string
  genres: string[]
  followers: number
  popularity: number
  showCount: number
  upcomingShows: number
}

interface ArtistsPageClientProps {
  artists: Artist[]
}

export function ArtistsPageClient({ artists }: ArtistsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.genres.some((genre: string) => 
      genre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredArtists.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>

      {/* No Results */}
      {filteredArtists.length === 0 && (
        <div className="text-center py-12">
          <Music className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No artists found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No artists available yet'}
          </p>
        </div>
      )}
    </>
  )
} 