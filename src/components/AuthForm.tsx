import { useState } from 'react';
import { supabase } from '@/integrations/supabase';
import { Auth } from '@supabase/ui';

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpotifyLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user-read-email user-read-private user-follow-read user-top-read user-library-read playlist-read-private playlist-read-collaborative'
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Spotify login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to login with Spotify');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <button onClick={handleSpotifyLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login with Spotify'}
      </button>
    </div>
  );
}
```