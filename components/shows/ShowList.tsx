import { ShowCard } from './ShowCard'
import { Skeleton } from '@/components/ui/skeleton'

interface Show {
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

interface ShowListProps {
  shows?: Show[]
  isLoading?: boolean
  emptyMessage?: string
}

export function ShowList({ shows, isLoading, emptyMessage = "No shows found" }: ShowListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 bg-gray-800" />
        ))}
      </div>
    )
  }

  if (!shows || shows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  )
}