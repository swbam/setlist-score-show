'use client'

import { UnifiedSearch } from '@/components/search/UnifiedSearch'

interface ClientSearchWrapperProps {
  placeholder?: string
  className?: string
}

export function ClientSearchWrapper({ placeholder, className }: ClientSearchWrapperProps) {
  return (
    <UnifiedSearch 
      placeholder={placeholder}
      className={className}
    />
  )
}