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
    console.log('🎪 Starting comprehensive show sync job');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    // Phase 1: Sync shows for existing artists that need updates
    console.log('🎯 Phase 1: Syncing existing artists...');
    
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, ticketmaster_id, last_synced_at')
      .or(`last_synced_at.is.null,last_synced_at.lt.'${twentyFourHoursAgo.toISOString()}'`)
      .order('popularity', { ascending: false }) // Prioritize popular artists
      .limit(30); // Increased limit for better coverage

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    let existingProcessed = 0;
    let existingShowsStored = 0;

    for (const artist of artists || []) {
      try {
        console.log(`🎤 Syncing existing artist: ${artist.name}`);
        
        if (artist.ticketmaster_id) {
          // Direct search by Ticketmaster artist ID (more accurate)
          const directUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
          directUrl.searchParams.append('apikey', ticketmasterApiKey);
          directUrl.searchParams.append('attractionId', artist.ticketmaster_id);
          directUrl.searchParams.append('size', '100');
          directUrl.searchParams.append('sort', 'date,asc');
          directUrl.searchParams.append('startDateTime', new Date().toISOString());

          const response = await fetch(directUrl.toString());

          if (response.ok) {
            const data = await response.json();
            const events = data._embedded?.events || [];
            
            existingShowsStored += await processEventsForArtist(supabase, artist, events);
            console.log(`✅ Found ${events.length} shows for ${artist.name}`);
          }
        } else {
          // Fallback to name search
          const searchUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
          searchUrl.searchParams.append('apikey', ticketmasterApiKey);
          searchUrl.searchParams.append('keyword', artist.name);
          searchUrl.searchParams.append('classificationName', 'Music');
          searchUrl.searchParams.append('size', '50');
          searchUrl.searchParams.append('sort', 'date,asc');
          searchUrl.searchParams.append('startDateTime', new Date().toISOString());

          const response = await fetch(searchUrl.toString());

          if (response.ok) {
            const data = await response.json();
            const events = data._embedded?.events || [];
            
            // Filter for exact artist matches
            const matchingEvents = events.filter((event: any) => {
              const eventArtists = event._embedded?.attractions || [];
              return eventArtists.some((attraction: any) => 
                attraction.name.toLowerCase() === artist.name.toLowerCase()
              );
            });
            
            existingShowsStored += await processEventsForArtist(supabase, artist, matchingEvents);
            console.log(`✅ Found ${matchingEvents.length} matching shows for ${artist.name}`);
          }
        }

        // Update artist's last_synced_at
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);

        existingProcessed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error syncing existing artist ${artist.name}:`, error);
      }
    }

    // Phase 2: Discover trending/popular shows and new artists
    console.log('🔥 Phase 2: Discovering trending shows...');
    
    let newArtistsFound = 0;
    let trendingShowsStored = 0;

    // Search for popular music events in major markets
    const majorMarkets = [
      { market: 'DMA220', name: 'New York' },  
      { market: 'DMA298', name: 'Los Angeles' },
      { market: 'DMA269', name: 'Chicago' },
      { market: 'DMA212', name: 'San Francisco' },
      { market: 'DMA213', name: 'Seattle' },
      { market: 'DMA217', name: 'Boston' },
      { market: 'DMA237', name: 'Philadelphia' },
      { market: 'DMA234', name: 'Miami' },
      { market: 'DMA346', name: 'Atlanta' }
    ];

    for (const market of majorMarkets.slice(0, 4)) { // Limit to prevent rate limiting
      try {
        console.log(`🌟 Searching trending shows in ${market.name}...`);
        
        const trendingUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
        trendingUrl.searchParams.append('apikey', ticketmasterApiKey);
        trendingUrl.searchParams.append('classificationName', 'Music');
        trendingUrl.searchParams.append('dmaId', market.market);
        trendingUrl.searchParams.append('size', '50');
        trendingUrl.searchParams.append('sort', 'relevance,desc'); // Get most relevant/popular
        trendingUrl.searchParams.append('startDateTime', new Date().toISOString());
        
        // Get events for next 6 months
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 6);
        trendingUrl.searchParams.append('endDateTime', endDate.toISOString());

        const response = await fetch(trendingUrl.toString());

        if (response.ok) {
          const data = await response.json();
          const events = data._embedded?.events || [];

          console.log(`📈 Found ${events.length} trending events in ${market.name}`);

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
                  // Create new trending artist
                  const { data: newArtist, error: artistError } = await supabase
                    .from('artists')
                    .insert({
                      name: attraction.name,
                      slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      ticketmaster_id: attraction.id,
                      genres: attraction.classifications?.[0]?.genre?.name ? [attraction.classifications[0].genre.name] : [],
                      popularity: 50, // Default trending popularity
                      followers: 0,
                      last_synced_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                  if (!artistError && newArtist) {
                    artistRecord = newArtist;
                    newArtistsFound++;
                    console.log(`🆕 Added trending artist: ${attraction.name}`);
                  }
                }

                // Store the trending show
                if (artistRecord) {
                  const stored = await processEventsForArtist(supabase, artistRecord, [event]);
                  trendingShowsStored += stored;
                }
              }
            } catch (eventError) {
              console.warn(`Error processing trending event:`, eventError);
            }
          }
        }

        // Rate limiting between markets
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (marketError) {
        console.error(`Error searching market ${market.name}:`, marketError);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: 'Comprehensive show sync completed',
      stats: {
        phase1: {
          existingArtistsProcessed: existingProcessed,
          existingShowsStored: existingShowsStored,
        },
        phase2: {
          newArtistsFound,
          trendingShowsStored,
        },
        total: {
          showsStored: existingShowsStored + trendingShowsStored,
          artistsProcessed: existingProcessed + newArtistsFound,
        }
      },
      duration,
    };

    console.log(`🎉 Comprehensive show sync completed in ${duration}ms`);
    console.log(`📊 Stats: ${existingProcessed} existing artists, ${newArtistsFound} new artists, ${existingShowsStored + trendingShowsStored} total shows`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in show sync:', error);
    
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

// Helper function to process events for an artist
async function processEventsForArtist(supabase: any, artist: any, events: any[]): Promise<number> {
  let storedCount = 0;

  for (const event of events) {
    try {
      // Check if show already exists
      const { data: existingShow } = await supabase
        .from('shows')
        .select('id')
        .eq('ticketmaster_id', event.id)
        .single();

      if (existingShow) {
        continue; // Skip existing shows
      }

      const venue = event._embedded?.venues?.[0];
      if (!venue) continue;

      // Create or get venue
      let venueId: string;
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
            country: venue.country?.name || 'Unknown',
            ticketmaster_id: venue.id,
            latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
            timezone: venue.timezone,
          })
          .select('id')
          .single();

        if (venueError) throw venueError;
        venueId = newVenue.id;
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
        // Add popular songs to setlist
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

      storedCount++;

    } catch (error) {
      console.warn(`Error processing event ${event.id}:`, error);
    }
  }

  return storedCount;
}