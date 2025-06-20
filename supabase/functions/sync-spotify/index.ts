import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

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
  
  // Handle CORS & Auth
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  const supabase = createServiceClient();
  
  try {
    console.log('🎵 Starting MVP Spotify catalog sync job');
    
    // Log sync start
    const { data: syncRecord } = await supabase
      .from('sync_history')
      .insert({
        sync_type: 'spotify',
        entity_type: 'songs',
        status: 'started'
      })
      .select('id')
      .single()
    
    const syncId = syncRecord?.id
    
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

    // Get artists needing catalog sync (MVP: limit to 5 artists per run)
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, spotify_id, last_synced_at')
      .or('last_synced_at.is.null,last_synced_at.lt.now() - interval \'7 days\'')
      .limit(5); // MVP: reduced from 15 to 5

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    if (!artists || artists.length === 0) {
      // Update sync history
      if (syncId) {
        await supabase
          .from('sync_history')
          .update({
            status: 'completed',
            items_processed: 0,
            completed_at: new Date().toISOString()
          })
          .eq('id', syncId)
      }
      
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
    let totalSongs = 0;
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
            const spotifyArtist = searchData.artists.items[0];
            spotifyArtistId = spotifyArtist.id;
            
            // Update artist with Spotify data
            await supabase
              .from('artists')
              .update({ 
                spotify_id: spotifyArtistId,
                image_url: spotifyArtist.images?.[0]?.url || null,
                popularity: spotifyArtist.popularity || 50,
                followers: spotifyArtist.followers?.total || 0,
                genres: spotifyArtist.genres || []
              })
              .eq('id', artist.id);
          } else {
            throw new Error('Artist not found on Spotify');
          }
        }

        // Get top tracks only for MVP (faster than full catalog)
        const topTracksResponse = await fetch(
          `https://api.spotify.com/v1/artists/${spotifyArtistId}/top-tracks?market=US`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!topTracksResponse.ok) {
          throw new Error(`Failed to fetch top tracks: ${topTracksResponse.status}`);
        }

        const topTracksData = await topTracksResponse.json();
        const tracks = topTracksData.tracks || [];

        // Also get some albums for more variety (MVP: just 2 albums)
        const albumsResponse = await fetch(
          `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=album&market=US&limit=2`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (albumsResponse.ok) {
          const albumsData = await albumsResponse.json();
          
          for (const album of albumsData.items || []) {
            const tracksResponse = await fetch(
              `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=20`, // MVP: limit to 20 per album
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (tracksResponse.ok) {
              const tracksData = await tracksResponse.json();
              tracks.push(...(tracksData.items || []));
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Remove duplicates by track name
        const uniqueTracks = Array.from(
          new Map(tracks.map((track: any) => [track.name.toLowerCase(), track])).values()
        );

        console.log(`📀 Found ${uniqueTracks.length} unique tracks for ${artist.name}`);

        // Batch insert songs (MVP: smaller batches)
        if (uniqueTracks.length > 0) {
          const songsToInsert = uniqueTracks.map((track: any) => ({
            artist_id: artist.id,
            title: track.name,
            spotify_id: track.id,
            popularity: track.popularity || 0,
            duration_ms: track.duration_ms || 0,
            preview_url: track.preview_url,
          }));

          // Insert in smaller batches for MVP
          for (let i = 0; i < songsToInsert.length; i += 25) {
            const batch = songsToInsert.slice(i, i + 25);
            const { error: insertError } = await supabase
              .from('songs')
              .upsert(batch, {
                onConflict: 'artist_id,title'
              });

            if (insertError) {
              console.error(`Error inserting songs batch: ${insertError.message}`);
            } else {
              totalSongs += batch.length;
            }
          }
        }

        // Update artist's last_synced_at
        await supabase
          .from('artists')
          .update({ 
            last_synced_at: new Date().toISOString(),
            needs_spotify_sync: false
          })
          .eq('id', artist.id);

        successful++;
        console.log(`✅ Successfully synced ${artist.name} (${uniqueTracks.length} songs)`);

      } catch (error) {
        console.error(`❌ Error syncing ${artist.name}:`, error.message);
        errors.push(`${artist.name}: ${error.message}`);
      }

      processed++;
      
      // Rate limiting between artists
      if (processed < artists.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update sync history
    if (syncId) {
      await supabase
        .from('sync_history')
        .update({
          status: 'completed',
          items_processed: processed,
          completed_at: new Date().toISOString(),
          error_message: errors.length > 0 ? errors.join('; ') : null
        })
        .eq('id', syncId)
    }

    const duration = Date.now() - startTime;
    console.log(`🎵 Spotify sync completed: ${successful}/${processed} artists, ${totalSongs} songs, ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        successful,
        total_songs: totalSongs,
        errors: errors.length > 0 ? errors : undefined,
        duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Spotify sync failed:', error);
    
    // Log error to sync history
    await supabase
      .from('sync_history')
      .insert({
        sync_type: 'spotify',
        entity_type: 'songs',
        status: 'failed',
        error_message: error.message
      })

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});