import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  preview_url: string | null;
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify cron secret for scheduled runs or API key for manual runs
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (authHeader !== `Bearer ${cronSecret}` && 
        !req.headers.get('apikey')?.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '')) {
      console.error('Unauthorized Spotify sync request');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎵 Starting Spotify catalog sync job');
    
    const supabase = createServiceClient();
    const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    
    if (!spotifyClientId || !spotifyClientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Spotify token: ${tokenResponse.status}`);
    }

    const tokenData: SpotifyToken = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get artists needing catalog sync (not synced in 7 days or never synced)
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, spotify_id, last_synced_at')
      .or('last_synced_at.is.null,last_synced_at.lt.now() - interval \'7 days\'')
      .limit(15);

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    if (!artists || artists.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No artists need catalog sync',
          duration: Date.now() - startTime
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Found ${artists.length} artists to sync`);

    let processed = 0;
    let successful = 0;
    const errors: string[] = [];

    for (const artist of artists) {
      try {
        console.log(`🎤 Syncing catalog for: ${artist.name}`);
        
        let spotifyArtistId = artist.spotify_id;
        
        // If no Spotify ID, search for the artist
        if (!spotifyArtistId) {
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(artist.name)}&type=artist&limit=1`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );

          if (!searchResponse.ok) {
            throw new Error(`Spotify search failed: ${searchResponse.status}`);
          }

          const searchData = await searchResponse.json();
          if (searchData.artists?.items?.length > 0) {
            spotifyArtistId = searchData.artists.items[0].id;
            
            // Update artist with Spotify ID
            await supabase
              .from('artists')
              .update({ spotify_id: spotifyArtistId })
              .eq('id', artist.id);
          } else {
            throw new Error('Artist not found on Spotify');
          }
        }

        // Get all albums for the artist
        let allTracks: SpotifyTrack[] = [];
        let albumsUrl = `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=album,single&market=US&limit=50`;
        
        while (albumsUrl) {
          const albumsResponse = await fetch(albumsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (!albumsResponse.ok) {
            if (albumsResponse.status === 429) {
              const retryAfter = albumsResponse.headers.get('Retry-After') || '5';
              console.warn(`Rate limit hit, waiting ${retryAfter}s...`);
              await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
              continue;
            }
            throw new Error(`Failed to fetch albums: ${albumsResponse.status}`);
          }

          const albumsData = await albumsResponse.json();
          
          // Get tracks for each album
          for (const album of albumsData.items || []) {
            const tracksResponse = await fetch(
              `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (tracksResponse.ok) {
              const tracksData = await tracksResponse.json();
              allTracks = allTracks.concat(tracksData.items || []);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          albumsUrl = albumsData.next;
        }

        // Remove duplicates by track name
        const uniqueTracks = Array.from(
          new Map(allTracks.map(track => [track.name.toLowerCase(), track])).values()
        );

        console.log(`📀 Found ${uniqueTracks.length} unique tracks for ${artist.name}`);

        // Batch insert songs
        if (uniqueTracks.length > 0) {
          const songsToInsert = uniqueTracks.map(track => ({
            artist_id: artist.id,
            title: track.name,
            spotify_id: track.id,
            popularity: track.popularity || 0,
            duration_ms: track.duration_ms || 0,
            preview_url: track.preview_url,
          }));

          // Insert in batches of 100
          for (let i = 0; i < songsToInsert.length; i += 100) {
            const batch = songsToInsert.slice(i, i + 100);
            const { error: insertError } = await supabase
              .from('songs')
              .upsert(batch, {
                onConflict: 'artist_id,title',
                ignoreDuplicates: false,
              });

            if (insertError) {
              console.error(`Error inserting songs batch: ${insertError.message}`);
            }
          }
        }

        // Update artist's last_synced_at
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);

        successful++;
        console.log(`✅ Successfully synced ${artist.name}: ${uniqueTracks.length} tracks`);

        processed++;
        
        // Rate limiting between artists
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        processed++;
        const errorMsg = `${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`💥 Error syncing ${artist.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${processed} artists, ${successful} successful`,
      stats: {
        processed,
        successful,
        failed: processed - successful,
        errors: errors.slice(0, 5),
      },
      duration,
    };

    console.log(`🎉 Spotify sync completed: ${successful}/${processed} successful in ${duration}ms`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in Spotify sync:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});