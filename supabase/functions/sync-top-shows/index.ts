import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  try {
    console.log('🎪 Starting top shows sync job');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    // Fetch top 50 upcoming shows across the US
    console.log('🔥 Fetching top upcoming shows nationwide...');
    
    const topShowsUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    topShowsUrl.searchParams.append('apikey', ticketmasterApiKey);
    topShowsUrl.searchParams.append('classificationName', 'Music');
    topShowsUrl.searchParams.append('countryCode', 'US');
    topShowsUrl.searchParams.append('size', '50');
    topShowsUrl.searchParams.append('sort', 'relevance,desc'); // Get most relevant/popular
    topShowsUrl.searchParams.append('startDateTime', new Date().toISOString());
    
    // Get events for next 6 months
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
    let artistsQueued = 0;

    for (const event of events) {
      try {
        const artists = event._embedded?.attractions || [];
        
        for (const attraction of artists) {
          // Check if we already have this artist
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id, name, spotify_id')
            .or(`name.ilike.%${attraction.name}%,ticketmaster_id.eq.${attraction.id}`)
            .single();

          let artistRecord = existingArtist;

          if (!existingArtist) {
            // Create new top artist
            const { data: newArtist, error: artistError } = await supabase
              .from('artists')
              .insert({
                name: attraction.name,
                slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                ticketmaster_id: attraction.id,
                image_url: attraction.images?.[0]?.url || null,
                genres: attraction.classifications?.[0]?.genre?.name ? [attraction.classifications[0].genre.name] : [],
                popularity: 75, // High popularity for top shows
                followers: 0,
                last_synced_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (!artistError && newArtist) {
              artistRecord = newArtist;
              newArtistsFound++;
              console.log(`🆕 Added top artist: ${attraction.name}`);

              // Queue for Spotify sync if we don't have Spotify data
              await enqueueSpotifySync(supabase, newArtist.id);
              artistsQueued++;
            }
          } else if (!existingArtist.spotify_id) {
            // Queue existing artist for Spotify sync if missing
            await enqueueSpotifySync(supabase, existingArtist.id);
            artistsQueued++;
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
    const response = {
      success: true,
      message: 'Top shows sync completed',
      stats: {
        eventsProcessed: events.length,
        newArtistsFound,
        newShowsStored,
        newVenuesCreated,
        artistsQueuedForSpotify: artistsQueued,
      },
      duration,
    };

    console.log(`🎉 Top shows sync completed in ${duration}ms`);
    console.log(`📊 Stats: ${newArtistsFound} new artists, ${newShowsStored} new shows, ${newVenuesCreated} new venues`);

    return new Response(
      JSON.stringify(response),
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

// Helper function to queue artist for Spotify sync
async function enqueueSpotifySync(supabase: any, artistId: string): Promise<void> {
  try {
    // Check if already queued
    const { data: existing } = await supabase
      .from('artist_sync_queue')
      .select('id')
      .eq('artist_id', artistId)
      .eq('sync_type', 'spotify')
      .eq('status', 'pending')
      .single();

    if (!existing) {
      await supabase
        .from('artist_sync_queue')
        .insert({
          artist_id: artistId,
          sync_type: 'spotify',
          status: 'pending',
          created_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.warn(`Failed to queue Spotify sync for artist ${artistId}:`, error);
  }
}

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
        popularity: 75, // High popularity for top shows
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

    if (!setlistError && setlist) {
      // Add popular songs to setlist if we have them
      const { data: artistSongs } = await supabase
        .from('songs')
        .select('id')
        .eq('artist_id', artist.id)
        .order('popularity', { ascending: false })
        .limit(15);

      if (artistSongs && artistSongs.length > 0) {
        const setlistSongs = artistSongs.map((song: any, index: number) => ({
          setlist_id: setlist.id,
          song_id: song.id,
          position: index + 1,
          vote_count: 0,
        }));

        await supabase
          .from('setlist_songs')
          .insert(setlistSongs);
      }
    }

    return { showCreated: true, venueCreated };

  } catch (error) {
    console.warn(`Error processing event ${event.id}:`, error);
    return { showCreated: false, venueCreated: false };
  }
} 