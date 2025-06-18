import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, Users } from 'lucide-react'
import { HomepageShow } from '@/lib/queries/homepage'

interface ShowCardProps {
  show: HomepageShow
}

export function ShowCard({ show }: ShowCardProps) {
  const showDate = new Date(show.date)
  const formattedDate = showDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  return (
    <Link 
      href={`/shows/${show.id}`}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 -z-10">
        {show.artist.imageUrl ? (
          <Image
            src={show.artist.imageUrl}
            alt={show.artist.name}
            fill
            className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4 h-full flex flex-col">
        {/* Date Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium w-fit">
          <Calendar className="w-3 h-3" />
          {formattedDate}
        </div>

        {/* Artist & Show Info */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">
            {show.artist.name}
          </h3>
          {show.title && show.title !== `${show.artist.name} at ${show.venue.name}` && (
            <p className="text-sm text-gray-300 line-clamp-1 mb-2">
              {show.title}
            </p>
          )}
        </div>

        {/* Venue Info */}
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="line-clamp-1">
            {show.venue.name}, {show.venue.city}
          </span>
        </div>

        {/* Vote Count & Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{show.totalVotes} votes</span>
          </div>
          
          {show.totalVotes > 0 && (
            <div className="flex -space-x-1">
              {[...Array(Math.min(3, Math.floor(show.totalVotes / 5) + 1))].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  )
}
