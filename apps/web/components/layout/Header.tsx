'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X, Music2, Search, User } from 'lucide-react'
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
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Music2 className="w-8 h-8 text-white" />
            <span className="text-xl font-headline font-bold text-white">TheSet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
            >
              Explore
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
              >
                My Artists
              </Link>
            )}
          </nav>

          {/* Desktop Search and Actions */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 bg-input border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors w-48 text-foreground placeholder-muted-foreground font-body"
              />
            </form>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm px-5 py-2"
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
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="px-4 py-4 space-y-4">
            <Link
              href="/explore"
              className="block text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore
            </Link>
            {user && (
              <Link
                href="/my-artists"
                className="block text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                My Artists
              </Link>
            )}
            
            <div className="pt-4 border-t border-border">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block text-muted-foreground hover:text-foreground transition-colors mb-4 font-body font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="block text-muted-foreground hover:text-foreground transition-colors font-body font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-muted-foreground hover:text-foreground transition-colors mb-4 font-body font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="btn-primary text-center block w-full"
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