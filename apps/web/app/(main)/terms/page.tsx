export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-3xl">
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
          <p>
            By using TheSet, you agree to these terms of service and our privacy policy.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Use of Service</h2>
          <ul className="space-y-2">
            <li>• You must be at least 13 years old to use this service</li>
            <li>• You are responsible for maintaining the security of your account</li>
            <li>• You agree not to misuse our voting system</li>
            <li>• You agree not to spam or harass other users</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Voting Guidelines</h2>
          <ul className="space-y-2">
            <li>• Vote limits apply per show and per day</li>
            <li>• Votes should reflect genuine preferences</li>
            <li>• Manipulation of voting results is prohibited</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Privacy</h2>
          <p>
            We respect your privacy and handle your data according to our privacy policy.
            Your Spotify data is used only for artist recommendations and is not stored permanently.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.
          </p>
        </div>
      </div>
    </div>
  )
} 