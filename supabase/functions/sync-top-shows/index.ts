import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { verifyAuth } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const { isAuthorized } = await verifyAuth(req);
    
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎪 Starting top shows sync job');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    console.log('🔥 Fetching top upcoming shows nationwide...');
    
    const topShowsUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    topShowsUrl.searchParams.append('apikey', ticketmasterApiKey);
    topShowsUrl.searchParams.append('classificationName', 'Music');
    topShowsUrl.searchParams.append('countryCode', 'US');
    topShowsUrl.searchParams.append('size', '50');
    topShowsUrl.searchParams.append('sort', 'relevance,desc');
    topShowsUrl.searchParams.append('startDateTime', new Date().toISOString());
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    topShowsUrl.searchParams.append('endDateTime', endDate.toISOString());

    const response = await fetch(topShowsUrl.toString());

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];

    console.log(`📈 Found ${events.length} top events nationwide`);

    let newArtistsFound = 0;
    let newShowsStored = 0;
    let newVenuesCreated = 0;

    for (const event of events) {
      try {
        const artists = event._embedded?.attractions || [];
        
        for (const attraction of artists) {
          // Check if we already have this artist
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id, name')
            .or(`name.ilike.%${attraction.name}%,ticketmaster_id.eq.${attraction.id}`)
            .single();

          let artistRecord = existingArtist;

          if (!existingArtist) {
            // Try to find Spotify ID for the artist
            let spotifyId = null;
            
            try {
              // Get Spotify access token
              const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
              const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
              
              if (spotifyClientId && spotifyClientSecret) {
                const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
                  },
                  body: 'grant_type=client_credentials',
                });

                if (tokenResponse.ok) {
                  const tokenData = await tokenResponse.json();
                  const accessToken = tokenData.access_token;

                  // Search for artist on Spotify
                  const searchResponse = await fetch(
                    `https://api.spotify.com/v1/search?q=${encodeURIComponent(attraction.name)}&type=artist&limit=1`,
                    {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.artists?.items?.length > 0) {
                      spotifyId = searchData.artists.items[0].id;
                    }
                  }
                }
              }
            } catch (spotifyError) {
              console.warn('Error searching for artist on Spotify:', spotifyError);
            }

            // Create new top artist
            const { data: newArtist, error: artistError } = await supabase
              .from('artists')
              .insert({
                name: attraction.name,
                slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                ticketmaster_id: attraction.id,
                spotify_id: spotifyId,
                image_url: attraction.images?.[0]?.url || null,
                genres: attraction.classifications?.[0]?.genre?.name ? [attraction.classifications[0].genre.name] : [],
                popularity: 75,
                followers: 0,
                last_synced_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (!artistError && newArtist) {
              artistRecord = newArtist;
              newArtistsFound++;
              console.log(`🆕 Added top artist: ${attraction.name}${spotifyId ? ' with Spotify ID' : ''}`);
            }
          }

          // Store the top show
          if (artistRecord) {
            const stored = await processEventForArtist(supabase, artistRecord, event);
            if (stored.showCreated) newShowsStored++;
            if (stored.venueCreated) newVenuesCreated++;
          }
        }
      } catch (eventError) {
        console.warn(`Error processing top event:`, eventError);
      }

      // Rate limiting between events
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const duration = Date.now() - startTime;
    const responseData = {
      success: true,
      message: 'Top shows sync completed',
      stats: {
        eventsProcessed: events.length,
        newArtistsFound,
        newShowsStored,
        newVenuesCreated,
      },
      duration,
    };

    console.log(`🎉 Top shows sync completed in ${duration}ms`);
    console.log(`📊 Stats: ${newArtistsFound} new artists, ${newShowsStored} new shows, ${newVenuesCreated} new venues`);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in top shows sync:', error);
    
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

// Helper function to process a single event for an artist
async function processEventForArtist(supabase: any, artist: any, event: any): Promise<{showCreated: boolean, venueCreated: boolean}> {
  try {
    // Check if show already exists
    const { data: existingShow } = await supabase
      .from('shows')
      .select('id')
      .eq('ticketmaster_id', event.id)
      .single();

    if (existingShow) {
      return { showCreated: false, venueCreated: false };
    }

    const venue = event._embedded?.venues?.[0];
    if (!venue) return { showCreated: false, venueCreated: false };

    // Create or get venue
    let venueId: string;
    let venueCreated = false;
    const { data: existingVenue } = await supabase
      .from('venues')
      .select('id')
      .eq('ticketmaster_id', venue.id)
      .single();

    if (existingVenue) {
      venueId = existingVenue.id;
    } else {
      const { data: newVenue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venue.name,
          city: venue.city?.name || 'Unknown',
          state: venue.state?.name || venue.state?.stateCode || '',
          country: venue.country?.name || 'US',
          ticketmaster_id: venue.id,
          latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
          longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
          timezone: venue.timezone,
        })
        .select('id')
        .single();

      if (venueError) throw venueError;
      venueId = newVenue.id;
      venueCreated = true;
    }

    // Create show
    const eventDate = new Date(event.dates.start.localDate);
    const { data: newShow, error: showError } = await supabase
      .from('shows')
      .insert({
        artist_id: artist.id,
        venue_id: venueId,
        date: eventDate.toISOString(),
        title: event.name,
        ticketmaster_id: event.id,
        ticketmaster_url: event.url,
        status: 'upcoming',
        view_count: 0,
        popularity: 75,
      })
      .select('id')
      .single();

    if (showError) throw showError;

    // Create default setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: newShow.id,
        name: 'Main Set',
        order_index: 0,
      })
      .select('id')
      .single();

    if (!setlist || setlistError) {
      console.warn('Failed to create setlist:', setlistError);
      return { showCreated: true, venueCreated };
    }

    // Now we need to populate the setlist with songs
    // First, check if artist has spotify_id
    if (artist.spotify_id) {
      try {
        // Get Spotify access token
        const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
        const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
        
        if (spotifyClientId && spotifyClientSecret) {
          const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
            },
            body: 'grant_type=client_credentials',
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Get artist's top tracks
            const topTracksResponse = await fetch(
              `https://api.spotify.com/v1/artists/${artist.spotify_id}/top-tracks?market=US`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            );

            if (topTracksResponse.ok) {
              const topTracksData = await topTracksResponse.json();
              const tracks = topTracksData.tracks || [];
              
              // Limit to 10 tracks for the default setlist
              const setlistTracks = tracks.slice(0, 10);
              
              for (let i = 0; i < setlistTracks.length; i++) {
                const track = setlistTracks[i];
                
                // Check if song exists
                const { data: existingSong } = await supabase
                  .from('songs')
                  .select('id')
                  .eq('artist_id', artist.id)
                  .eq('title', track.name)
                  .single();

                let songId: string;
                
                if (existingSong) {
                  songId = existingSong.id;
                } else {
                  // Create new song
                  const { data: newSong, error: songError } = await supabase
                    .from('songs')
                    .insert({
                      artist_id: artist.id,
                      title: track.name,
                      spotify_id: track.id,
                      popularity: track.popularity || 0,
                      duration_ms: track.duration_ms || 0,
                      preview_url: track.preview_url,
                      spotify_url: track.external_urls?.spotify || null,
                    })
                    .select('id')
                    .single();

                  if (songError || !newSong) {
                    console.warn('Failed to create song:', songError);
                    continue;
                  }
                  
                  songId = newSong.id;
                }

                // Create setlist_song entry
                await supabase
                  .from('setlist_songs')
                  .insert({
                    setlist_id: setlist.id,
                    song_id: songId,
                    position: i,
                  });
              }
              
              console.log(`Added ${setlistTracks.length} songs to setlist for ${event.name}`);
            }
          }
        }
      } catch (spotifyError) {
        console.warn('Error fetching Spotify tracks for setlist:', spotifyError);
      }
    }

    return { showCreated: true, venueCreated };

  } catch (error) {
    console.warn(`Error processing event ${event.id}:`, error);
    return { showCreated: false, venueCreated: false };
  }
} 