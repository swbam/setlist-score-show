import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const start = performance.now();
    
    const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify configuration');
    }

    // Get access token using client credentials flow
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error(`Spotify token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Test API with a simple search
    const searchResponse = await fetch(
      'https://api.spotify.com/v1/search?q=test&type=artist&limit=1',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Spotify API test failed: ${searchResponse.status}`);
    }

    const responseTime = performance.now() - start;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      metrics: {
        tokenObtained: true,
        apiAccessible: true,
        totalTime: responseTime
      }
    });
  } catch (error) {
    console.error('Spotify health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Spotify API connection failed'
    });
  }
}
