'use client'

import { useState } from 'react'
import { 
  RefreshCw, 
  Music, 
  Calendar, 
  TrendingUp, 
  Database,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

const SYNC_JOBS = [
  {
    id: 'sync-homepage-orchestrator',
    name: 'Full Homepage Sync',
    description: 'Sync all artists, shows, and venues',
    icon: Database,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'sync-ticketmaster-shows',
    name: 'Ticketmaster Shows',
    description: 'Import upcoming shows from Ticketmaster',
    icon: Calendar,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'sync-spotify-catalog',
    name: 'Spotify Catalogs',
    description: 'Update artist song catalogs',
    icon: Music,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'refresh-trending-shows',
    name: 'Calculate Trending',
    description: 'Update trending shows and artists',
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'sync-setlists',
    name: 'Import Setlists',
    description: 'Import actual performed setlists',
    icon: RefreshCw,
    color: 'from-indigo-500 to-purple-500'
  }
]

export function AdminPanel() {
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({})

  const triggerSync = async (jobId: string) => {
    setRunning(prev => ({ ...prev, [jobId]: true }))
    setResults(prev => ({ ...prev, [jobId]: undefined }))

    try {
      const response = await fetch(`/api/admin/trigger/${jobId}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger sync')
      }

      setResults(prev => ({ ...prev, [jobId]: 'success' }))
    } catch (error) {
      setResults(prev => ({ ...prev, [jobId]: 'error' }))
      console.error('Sync failed:', error)
    } finally {
      setRunning(prev => ({ ...prev, [jobId]: false }))
    }
  }

  const triggerAllJobs = async () => {
    for (const job of SYNC_JOBS) {
      await triggerSync(job.id)
      // Add small delay between jobs
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return (
    <div className="p-6 bg-gray-900/50 border border-white/10 rounded-2xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2 text-white">Admin Controls</h3>
          <p className="text-sm text-gray-400">
            Manually trigger data sync operations
          </p>
        </div>

        <div className="grid gap-4">
          {SYNC_JOBS.map((job) => {
            const Icon = job.icon
            const isRunning = running[job.id]
            const result = results[job.id]

            return (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 rounded-lg bg-black/50 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${job.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{job.name}</h4>
                    <p className="text-sm text-gray-400">{job.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {result === 'error' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <button
                    onClick={() => triggerSync(job.id)}
                    disabled={isRunning}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      'Run'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={triggerAllJobs}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Run All Sync Jobs
          </button>
        </div>
      </div>
    </div>
  )
}
