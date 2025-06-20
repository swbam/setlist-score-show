export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-3xl">
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
          <ul className="space-y-2">
            <li>• Account information when you sign up</li>
            <li>• Voting data and preferences</li>
            <li>• Spotify data when you connect your account (artist follows, top artists)</li>
            <li>• Usage data to improve our service</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Data</h2>
          <ul className="space-y-2">
            <li>• To provide personalized concert recommendations</li>
            <li>• To enable voting on setlists</li>
            <li>• To improve our service and user experience</li>
            <li>• To communicate important updates</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Spotify Integration</h2>
          <p>
            When you connect your Spotify account, we access your followed artists and top artists 
            to provide personalized recommendations. We do not store your Spotify login credentials 
            or access your private playlists without permission.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share anonymized, aggregated data for 
            research purposes. Voting results are public by design.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
          <p>
            We use industry-standard security measures to protect your data, including encryption 
            and secure authentication through Supabase.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
          <ul className="space-y-2">
            <li>• Access your personal data</li>
            <li>• Request data deletion</li>
            <li>• Disconnect Spotify integration at any time</li>
            <li>• Opt out of communications</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us through our support channels.
          </p>
        </div>
      </div>
    </div>
  )
} 