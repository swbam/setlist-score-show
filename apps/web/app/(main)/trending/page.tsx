'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TrendingRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/explore?tab=trending')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to Explore...</p>
      </div>
    </div>
  )
}