'use client'

import { useState } from 'react'
import { createTestData } from '@/lib/create-test-data'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const [status, setStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSetup = async () => {
    setIsLoading(true)
    setStatus('Creating test data...')
    
    try {
      const success = await createTestData()
      if (success) {
        setStatus('✅ Test data created successfully! You can now view shows and artists.')
      } else {
        setStatus('❌ Failed to create test data. Check the console for errors.')
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 card-base rounded-lg">
        <h1 className="text-2xl font-bold mb-4 gradient-text text-center">Database Setup</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Click the button below to create test data for the app.
        </p>
        
        <Button
          onClick={handleSetup}
          disabled={isLoading}
          className="w-full mb-4"
        >
          {isLoading ? 'Creating Data...' : 'Create Test Data'}
        </Button>
        
        {status && (
          <div className="p-4 bg-muted/20 rounded-lg text-sm">
            {status}
          </div>
        )}
      </div>
    </div>
  )
}