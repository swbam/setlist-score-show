import { useCallback, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface InfiniteListProps<T> {
  items: T[]
  isLoading?: boolean
  hasMore?: boolean
  loadMore: () => void
  itemHeight?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
}

/**
 * Generic virtualised infinite list.
 *
 * 1. Uses @tanstack/react-virtual for performant windowing.
 * 2. Triggers `loadMore` when the user scrolls near the bottom and `hasMore` is true.
 */
export function InfiniteList<T>({
  items,
  isLoading,
  hasMore,
  loadMore,
  itemHeight = 96,
  overscan = 10,
  renderItem,
}: InfiniteListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null)

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  })

  // Detect when user reaches near bottom to fetch next page
  const maybeLoadMore = useCallback(() => {
    if (!hasMore || isLoading) return

    const { scrollHeight, scrollTop, clientHeight } = parentRef.current || {}
    if (!scrollHeight) return

    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
    if (distanceFromBottom < itemHeight * overscan) {
      loadMore()
    }
  }, [hasMore, isLoading, loadMore, itemHeight, overscan])

  return (
    <div
      ref={parentRef}
      onScroll={maybeLoadMore}
      className="relative w-full h-full overflow-auto"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
      {isLoading && (
        <div className="py-6 text-center text-muted-foreground">Loading…</div>
      )}
    </div>
  )
} 