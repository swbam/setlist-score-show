import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            Vote on Concert Setlists
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Help shape the setlist for upcoming concerts by voting on the songs you want to hear most
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shows"
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200"
            >
              Browse Shows
            </Link>
            <Link
              href="/artists"
              className="px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
            >
              Find Artists
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Find a Show</h3>
              <p className="text-gray-400">
                Search for upcoming concerts from your favorite artists
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Vote for Songs</h3>
              <p className="text-gray-400">
                Cast your votes for the songs you want to hear live
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">See Results</h3>
              <p className="text-gray-400">
                Watch in real-time as votes come in and influence the setlist
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to influence your favorite concerts?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of fans voting on setlists for upcoming shows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started Free
            </Link>
            <Link
              href="/shows"
              className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors duration-200"
            >
              Browse Shows
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}