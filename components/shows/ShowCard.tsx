import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users, TrendingUp } from 'lucide-react'

interface ShowCardProps {
  show: {
    id: string
    date: string
    title: string
    status: string
    view_count: number
    artist: {
      id: string
      name: string
      image_url?: string
    }
    venue: {
      id: string
      name: string
      city: string
      state?: string
      country: string
    }
    _count?: {
      votes: number
    }
  }
}

export function ShowCard({ show }: ShowCardProps) {
  const showDate = new Date(show.date)
  const isUpcoming = showDate > new Date()
  const isPast = !isUpcoming || show.status === 'completed'

  return (
    <Link href={`/shows/${show.id}`}>
      <Card className={`h-full bg-gray-900 border-gray-800 transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1 ${isPast ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={show.artist.image_url} alt={show.artist.name} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                  {show.artist.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">{show.artist.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-1">{show.title || 'Concert'}</p>
              </div>
            </div>
            
            {show.status === 'upcoming' && show._count && show._count.votes > 10 && (
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/50">
                <TrendingUp className="w-3 h-3 mr-1" />
                Hot
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {show.venue.name}, {show.venue.city}
              {show.venue.state && `, ${show.venue.state}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{format(showDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>

          {show._count && show._count.votes > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{show._count.votes} votes cast</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3">
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Show Status</span>
              <Badge 
                variant={show.status === 'upcoming' ? 'default' : 'secondary'}
                className={
                  show.status === 'upcoming' 
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/50' 
                    : show.status === 'completed'
                    ? 'bg-gray-700 text-gray-400'
                    : show.status === 'cancelled'
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                }
              >
                {show.status.charAt(0).toUpperCase() + show.status.slice(1)}
              </Badge>
            </div>
            
            {isUpcoming && show.status !== 'cancelled' && (
              <div className="text-center">
                <p className="text-xs text-teal-400 font-medium">Click to vote on songs</p>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}