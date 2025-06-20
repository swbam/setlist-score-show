export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About TheSet</h1>
        <div className="prose dark:prose-invert max-w-3xl">
          <p className="text-lg mb-4">
            TheSet is a fan-powered concert setlist voting platform that transforms how music fans interact with live shows.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
          <ul className="space-y-2">
            <li>• Discover trending artists and upcoming concerts</li>
            <li>• Vote on songs you want to hear at upcoming shows</li>
            <li>• See real-time community voting results</li>
            <li>• Compare fan predictions with actual performed setlists</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
          <ul className="space-y-2">
            <li>• Real-time setlist voting</li>
            <li>• Spotify integration for personalized recommendations</li>
            <li>• Concert discovery through Ticketmaster integration</li>
            <li>• Actual setlist comparison via setlist.fm</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 