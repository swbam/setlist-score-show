'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/lib/graphql-client'
import { GET_MY_ARTISTS } from '@/lib/graphql/queries'
import { useAuth } from '@/hooks/useAuth'
import { ArtistGrid } from '@/components/artists/ArtistGrid'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Music2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function MyArtistsPage() {
  const { user, loading } = useAuth()
  const client = useGraphQLClient()
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myArtists', user?.id],
    queryFn: async () => {
      return client.request(GET_MY_ARTISTS)
    },
    enabled: !!user,
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleImportFromSpotify = useCallback(async () => {
    if (!user) return
    
    setIsImporting(true)
    try {
      // Check if user has Spotify connected
      if (!user.app_metadata?.provider || user.app_metadata.provider !== 'spotify') {
        // Redirect to Spotify auth
        const { data: { url }, error } = await supabase.auth.signInWithOAuth({
          provider: 'spotify',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=/my-artists&action=import`,
            scopes: 'user-top-read user-follow-read',
          },
        })
        
        if (error) {
          toast.error('Failed to connect with Spotify')
          return
        }
        
        if (url) {
          window.location.href = url
        }
        return
      }
      
      // Import artists
      toast.info('Importing your Spotify artists...')
      const importResult = await client.request(`
        mutation ImportSpotifyArtists {
          importSpotifyArtists {
            artist {
              id
              name
              imageUrl
            }
            followedAt
          }
        }
      `)
      
      const imported = (importResult as any)?.importSpotifyArtists || []
      
      if (imported.length > 0) {
        toast.success(`Imported ${imported.length} artists from Spotify!`)
        refetch() // Refresh the list
      } else {
        toast.info('No new artists to import')
      }
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error('Failed to import artists from Spotify')
    } finally {
      setIsImporting(false)
    }
  }, [user, client, refetch])

  // Check for action parameter on page load (after Spotify OAuth redirect)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const action = searchParams.get('action')
    
    if (action === 'import' && user && !isImporting) {
      // Clear the action parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, '', url)
      
      // Trigger import
      handleImportFromSpotify()
    }
  }, [user, isImporting, handleImportFromSpotify])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const followedArtists = (data as any)?.myArtists || []

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">My Artists</h1>
          <p className="text-gray-400 text-lg">
            Artists you follow and their upcoming shows
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : !followedArtists.length ? (
          <div className="text-center py-16">
            <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No artists yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start following artists to see their upcoming shows and vote on setlists
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/artists"
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Browse Artists
              </Link>
              <button
                onClick={handleImportFromSpotify}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1aa34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                {isImporting ? 'Importing...' : 'Import from Spotify'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Following {followedArtists.length} {followedArtists.length === 1 ? 'artist' : 'artists'}
              </span>
              <button
                onClick={handleImportFromSpotify}
                disabled={isImporting}
                className="btn-primary"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                {isImporting ? 'Importing...' : 'Import More'}
              </button>
            </div>
            <ArtistGrid 
              artists={followedArtists.map((fa: any) => ({
                ...fa.artist,
                followedAt: fa.followed_at || fa.followedAt
              }))} 
            />
          </div>
        )}
      </div>
    </div>
  )
}