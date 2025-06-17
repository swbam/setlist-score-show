'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, Music2, User, Home, Compass, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { Button } from '@/components/ui/button'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-white/10 to-white/5 group-hover:from-white/15 group-hover:to-white/10 transition-all">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TheSet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/explore"
              className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                My Artists
              </Link>
            )}
          </nav>

          {/* Desktop Search and Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="w-80">
              <UnifiedSearch 
                placeholder="Search artists, venues, or zip code..."
                className="[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-gray-400 [&_input]:text-sm [&_input]:py-2 [&_input]:hover:bg-white/15 [&_input]:hover:border-white/30 [&_svg]:w-4 [&_svg]:h-4"
              />
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="p-2 rounded-full hover:bg-white/10 transition-all"
                >
                  <User className="w-5 h-5 text-gray-300" />
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-[2px] hover:bg-white/10 transition-all"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-xl border-t border-white/10">
          <nav className="px-4 py-4 space-y-1">
            {/* Mobile Search */}
            <div className="pb-4 mb-4 border-b border-white/10">
              <UnifiedSearch 
                placeholder="Search..."
                className="[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-gray-400 [&_input]:text-sm [&_input]:py-2"
                onResultClick={() => setIsMenuOpen(false)}
              />
            </div>

            {/* Main Navigation */}
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              Home
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <Compass className="w-5 h-5" />
              Explore
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="w-5 h-5" />
                My Artists
              </Link>
            )}
            
            <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-[2px] text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Button
                    asChild
                    variant="secondary"
                    size="default"
                    fullWidth
                  >
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="default"
                    fullWidth
                  >
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}