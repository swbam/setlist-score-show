'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  RefreshCw,
  Download,
  CheckSquare,
  Square,
  Calendar,
  Music,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface TopArtist {
  id: string
  name: string
  imageUrl?: string
  upcomingShowCount: number
  firstShowDate: string
  genres: string[]
}

interface ImportResult {
  id: string
  name: string
  status: 'success' | 'error'
  error?: string
  message?: string
}

export default function ImportTopArtistsPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [artists, setArtists] = useState<TopArtist[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set())

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/')
    }
  }, [user, loading, isAdmin, router])

  // Fetch top artists
  const fetchTopArtists = async () => {
    setIsLoading(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/admin/top-artists', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch top artists')
      }

      const data = await response.json()
      
      if (data.success) {
        setArtists(data.artists || [])
        setSelectedIds(new Set())
        setImportResults([])
        toast.success(`Found ${data.artists?.length || 0} new artists to import`)
      } else {
        throw new Error(data.error || 'Failed to fetch artists')
      }
    } catch (error) {
      console.error('Error fetching top artists:', error)
      toast.error('Failed to fetch top artists')
    } finally {
      setIsLoading(false)
    }
  }

  // Import selected artists
  const importSelectedArtists = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select artists to import')
      return
    }

    setIsImporting(true)
    try {
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error('No session found')
      }

      const selectedArtists = artists.filter(artist => selectedIds.has(artist.id))
      
      const response = await fetch('/api/admin/import-artists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artists: selectedArtists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to import artists')
      }

      const data = await response.json()
      
      if (data.success) {
        setImportResults(data.results || [])
        
        // Mark successful imports as imported
        const successfulIds = data.results
          .filter((r: ImportResult) => r.status === 'success')
          .map((r: ImportResult) => r.id)
        
        setImportedIds(prev => new Set([...prev, ...successfulIds]))
        setSelectedIds(new Set()) // Clear selection
        
        toast.success(data.message || `Imported ${data.stats?.success || 0} artists`)
        
        if (data.stats?.errors > 0) {
          toast.error(`${data.stats.errors} artists failed to import`)
        }
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Error importing artists:', error)
      toast.error('Failed to import artists')
    } finally {
      setIsImporting(false)
    }
  }

  // Toggle artist selection
  const toggleArtist = (artistId: string) => {
    if (importedIds.has(artistId)) return // Can't select already imported artists
    
    const newSelected = new Set(selectedIds)
    if (newSelected.has(artistId)) {
      newSelected.delete(artistId)
    } else {
      newSelected.add(artistId)
    }
    setSelectedIds(newSelected)
  }

  // Select all available artists
  const selectAll = () => {
    const availableIds = artists
      .filter(artist => !importedIds.has(artist.id))
      .map(artist => artist.id)
    setSelectedIds(new Set(availableIds))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Get import result for artist
  const getImportResult = (artistId: string): ImportResult | undefined => {
    return importResults.find(result => result.id === artistId)
  }

  // Load artists on mount
  useEffect(() => {
    if (user && isAdmin) {
      fetchTopArtists()
    }
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const availableCount = artists.filter(artist => !importedIds.has(artist.id)).length
  const allSelected = availableCount > 0 && selectedIds.size === availableCount

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Import Top Artists</h1>
          <p className="text-muted-foreground">
            Import popular artists with upcoming US shows that aren't in your database yet
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={fetchTopArtists}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={allSelected ? clearSelection : selectAll}
              disabled={availableCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allSelected ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              {allSelected ? 'Clear All' : 'Select All'}
            </button>

            <button
              onClick={importSelectedArtists}
              disabled={selectedIds.size === 0 || isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import Selected ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        {artists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card-base rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{artists.length}</div>
                  <div className="text-sm text-muted-foreground">Available Artists</div>
                </div>
              </div>
            </div>
            <div className="card-base rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{importedIds.size}</div>
                  <div className="text-sm text-muted-foreground">Already Imported</div>
                </div>
              </div>
            </div>
            <div className="card-base rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{selectedIds.size}</div>
                  <div className="text-sm text-muted-foreground">Selected</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artists Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Artists Found</h3>
            <p className="text-muted-foreground mb-4">
              Click "Refresh List" to fetch the latest top artists from Ticketmaster
            </p>
          </div>
        ) : (
          <div className="card-base rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left p-4 font-semibold">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={allSelected ? clearSelection : selectAll}
                        disabled={availableCount === 0}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold">Artist</th>
                    <th className="text-left p-4 font-semibold">Shows</th>
                    <th className="text-left p-4 font-semibold">Next Show</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((artist, index) => {
                    const isImported = importedIds.has(artist.id)
                    const isSelected = selectedIds.has(artist.id)
                    const importResult = getImportResult(artist.id)
                    
                    return (
                      <tr 
                        key={artist.id} 
                        className={`border-t border-border/50 hover:bg-muted/10 transition-colors ${
                          isImported ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleArtist(artist.id)}
                            disabled={isImported}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {artist.imageUrl ? (
                              <img
                                src={artist.imageUrl}
                                alt={artist.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <Music className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold">{artist.name}</div>
                              {artist.genres.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {artist.genres.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{artist.upcomingShowCount}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(artist.firstShowDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          {isImported ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Imported</span>
                            </div>
                          ) : importResult ? (
                            importResult.status === 'success' ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Success</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm">Failed</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">Available</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResults.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Import Results</h2>
            <div className="space-y-2">
              {importResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-3 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="font-medium">{result.name}</span>
                    <span className="text-sm">
                      {result.status === 'success' ? result.message : result.error}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 