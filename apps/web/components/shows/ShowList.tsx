import { ShowCard, type Show } from './ShowCard'
import { Skeleton } from '@/components/ui/skeleton'

interface ShowListProps {
  shows: Show[]
  isLoading?: boolean
  variant?: 'grid' | 'list'
  showStats?: boolean
  emptyMessage?: string
}

export function ShowList({ 
  shows, 
  isLoading, 
  variant = 'grid', 
  showStats = false,
  emptyMessage = 'No shows found.'
}: ShowListProps) {
  if (isLoading) {
    if (variant === 'grid') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )
    } else {
      return (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )
    }
  }

  if (!shows.length) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shows.map((show) => (
          <ShowCard 
            key={show.id} 
            show={show} 
            variant="grid" 
            showStats={showStats}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {shows.map((show) => (
        <ShowCard 
          key={show.id} 
          show={show} 
          variant="list" 
          showStats={showStats}
        />
      ))}
    </div>
  )
}