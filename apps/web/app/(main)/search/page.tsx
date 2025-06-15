'use client'

import { useEffect, useRef } from 'react'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    // Focus the search input when component mounts
    const timer = setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement
      input?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold mb-3 sm:mb-4 gradient-text">
            Search
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg font-body mb-6">
            Find artists, shows, venues, or enter zip code for nearby concerts
          </p>

          {/* Unified Search */}
          <UnifiedSearch 
            placeholder="Search artists, venues, cities, or enter zip code..."
            showResults={true}
          />
        </div>

        {/* Search handled by UnifiedSearch component */}
      </div>
    </div>
  )
}