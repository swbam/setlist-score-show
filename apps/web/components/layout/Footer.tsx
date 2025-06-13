import Link from 'next/link'
import { Music2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Music2 className="w-6 h-6 text-slate-400" />
              <span className="text-lg font-bold gradient-text">TheSet</span>
            </div>
            <p className="text-sm text-gray-400">
              Request and vote on songs for upcoming concerts to help shape the perfect setlist.
              <i>No artist work required.</i>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Discover</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shows" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Upcoming Shows
                </Link>
              </li>
              <li>
                <Link href="/artists" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Browse Artists
                </Link>
              </li>
              <li>
                <Link href="/trending" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2025 TheSet. All rights reserved.
          </p>
          <p className="text-sm text-gray-500">
            Made with ♪ for music fans
          </p>
        </div>
      </div>
    </footer>
  )
}