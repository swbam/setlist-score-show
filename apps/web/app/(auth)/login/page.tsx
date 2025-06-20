'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Music, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (userError) throw userError
      if (sessionError) throw sessionError
      
      setUser(user)
      setSession(session)
      
      // If authenticated, redirect to my-artists
      if (user) {
        router.push('/my-artists')
      }
    } catch (err: any) {
      console.error('Auth check error:', err)
      setError(err.message)
    }
  }

  async function loginWithSpotify() {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          scopes: 'user-follow-read user-top-read user-library-read',
          redirectTo: `${window.location.origin}/auth/callback?redirect=/my-artists`
        }
      })
      
      if (error) throw error
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <Logo className="h-12 w-auto mx-auto" />
          </Link>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to TheSet</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Spotify to discover your favorite artists on tour and vote on their setlists
            </p>
          </div>

          {/* Authentication Status */}
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Authenticated as {user.email}</span>
              </div>
              
              {session?.provider_token ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Spotify Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  <span>Spotify Not Connected</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Button onClick={() => router.push('/my-artists')} className="w-full">
                  Go to My Artists
                </Button>
                <Button onClick={logout} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={loginWithSpotify}
                disabled={isLoading}
                className="w-full bg-[#1DB954] hover:bg-[#1aa34a] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting to Spotify...
                  </>
                ) : (
                  <>
                    <Music className="h-5 w-5" />
                    Continue with Spotify
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500">
                We'll access your followed artists and top tracks to personalize your experience
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {/* Back to Home */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}