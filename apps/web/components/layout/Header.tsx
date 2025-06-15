'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, Music2, Search, User, Home, Compass } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-card border-b border-border w-full">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Music2 className="w-6 h-6 text-primary" />
            <span className="text-lg font-headline font-bold gradient-text">TheSet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground transition-colors font-body font-medium text-sm"
            >
              Explore
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="text-muted-foreground hover:text-foreground transition-colors font-body font-medium text-sm"
              >
                My Artists
              </Link>
            )}
          </nav>

          {/* Desktop Search and Actions */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors w-40 text-foreground placeholder-muted-foreground font-body"
              />
            </form>
            
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm px-4 py-1.5"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="px-4 py-3 space-y-3">
            {/* Main Navigation */}
            <Link
              href="/"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-body font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-body font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Compass className="w-4 h-4" />
              Explore
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-body font-medium py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-body font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                My Artists
              </Link>
            )}
            
            <div className="pt-3 border-t border-border">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors mb-3 font-body font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="block text-muted-foreground hover:text-foreground transition-colors font-body font-medium py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-muted-foreground hover:text-foreground transition-colors mb-3 font-body font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary text-center block w-full text-sm py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}