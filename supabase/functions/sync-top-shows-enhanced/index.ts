import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from './_shared/supabase.ts';
import { corsHeaders, handleCors } from './_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS & Auth
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  try {
    console.log('🎪 Starting enhanced shows sync job');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    // Get sync state
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('*')
      .eq('job_name', 'ticketmaster_shows_enhanced')
      .single();
    
    const lastSyncDate = syncState?.last_sync_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Update sync state to running
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows_enhanced',
        status: 'running',
        updated_at: new Date().toISOString()
      });
    
    // Fetch shows in sliding window (next 90 days)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let page = 0;
    let hasMore = true;
    const allShows: any[] = [];
    
    console.log(`🔥 Fetching shows from ${startDate} to ${endDate}`);
    
    while (hasMore && page < 1) {
      const topShowsUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
      topShowsUrl.searchParams.append('apikey', ticketmasterApiKey);
      topShowsUrl.searchParams.append('countryCode', 'US');
      topShowsUrl.searchParams.append('classificationName', 'Music');
      topShowsUrl.searchParams.append('startDateTime', `${startDate}T00:00:00Z`);
      topShowsUrl.searchParams.append('endDateTime', `${endDate}T23:59:59Z`);
      topShowsUrl.searchParams.append('size', '100');
      topShowsUrl.searchParams.append('page', page.toString());
      topShowsUrl.searchParams.append('sort', 'relevance,desc');
      topShowsUrl.searchParams.append('includeTBA', 'no');
      topShowsUrl.searchParams.append('includeTBD', 'no');
      
      const response = await fetch(topShowsUrl.toString());
      
      if (!response.ok) {
        console.error(`Ticketmaster API error on page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (data._embedded?.events) {
        allShows.push(...data._embedded.events);
        console.log(`📄 Page ${page}: Found ${data._embedded.events.length} events (Total: ${allShows.length})`);
      }
      
      hasMore = false;
      page++;
      
      // Rate limiting between pages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`📈 Total events found: ${allShows.length}`);
    
    // Process shows with proper deduplication
    const processedShows: any[] = [];
    const venueMap = new Map();
    const artistMap = new Map();
    
    let newArtistsFound = 0;
    let newShowsStored = 0;
    let newVenuesCreated = 0;
    let artistsQueued = 0;
    let duplicatesSkipped = 0;
    
    for (const event of allShows) {
      try {
        // Skip if no artist info
        const attractions = event._embedded?.attractions;
        if (!attractions?.length) continue;
        
        // Process venue first
        const venueData = event._embedded?.venues?.[0];
        if (!venueData) continue;
        
        let venueId = venueMap.get(venueData.id);
        if (!venueId) {
          // Check if venue exists by ticketmaster_id
          const { data: existingVenue } = await supabase
            .from('venues')
            .select('id')
            .eq('ticketmaster_id', venueData.id)
            .single();
          
          if (existingVenue) {
            venueId = existingVenue.id;
          } else {
            // Create new venue with PostGIS point
            const { data: newVenue, error: venueError } = await supabase
              .from('venues')
              .insert({
                ticketmaster_id: venueData.id,
                name: venueData.name,
                city: venueData.city?.name,
                state: venueData.state?.stateCode,
                country: venueData.country?.countryCode || 'US',
                address: venueData.address?.line1,
                capacity: venueData.generalInfo?.generalRule?.match(/\d+/)?.[0] || null,
                latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null,
                longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null,
                timezone: venueData.timezone,
                postal_code: venueData.postalCode
              })
              .select('id')
              .single();
            
            if (!venueError && newVenue) {
              venueId = newVenue.id;
              newVenuesCreated++;
              
              // Update PostGIS location if coordinates exist
              if (venueData.location?.latitude && venueData.location?.longitude) {
                await supabase.rpc('update_venue_location', {
                  venue_id: venueId,
                  lat: parseFloat(venueData.location.latitude),
                  lng: parseFloat(venueData.location.longitude)
                });
              }
            }
          }
          venueMap.set(venueData.id, venueId);
        }
        
        // Process artist
        const attraction = attractions[0];
        let artistId = artistMap.get(attraction.id);
        
        if (!artistId) {
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id, spotify_id')
            .eq('ticketmaster_id', attraction.id)
            .single();
          
          if (existingArtist) {
            artistId = existingArtist.id;
            // Queue for Spotify sync if missing
            if (!existingArtist.spotify_id) {
              await enqueueSpotifySync(supabase, existingArtist.id);
              artistsQueued++;
            }
          } else {
            // Create artist with better metadata
            const { data: newArtist, error: artistError } = await supabase
              .from('artists')
              .insert({
                ticketmaster_id: attraction.id,
                name: attraction.name,
                slug: attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                image_url: attraction.images?.find((img: any) => img.ratio === '16_9')?.url || 
                          attraction.images?.[0]?.url,
                genres: attraction.classifications?.[0]?.genre?.name ? 
                  [attraction.classifications[0].genre.name] : [],
                popularity: Math.floor(Math.random() * 30) + 70, // 70-100 for top shows
                needs_spotify_sync: true,
                last_synced_at: new Date().toISOString()
              })
              .select('id')
              .single();
            
            if (!artistError && newArtist) {
              artistId = newArtist.id;
              newArtistsFound++;
              console.log(`🆕 Added artist: ${attraction.name}`);
              
              // Queue for Spotify sync
              await enqueueSpotifySync(supabase, newArtist.id);
              artistsQueued++;
            }
          }
          artistMap.set(attraction.id, artistId);
        }
        
        // Skip if we don't have both artist and venue
        if (!artistId || !venueId) {
          console.warn(`⚠️ Skipping event ${event.id}: missing artistId=${artistId} or venueId=${venueId}`);
          continue;
        }
        
        // Check if show already exists
        const { data: existingShow } = await supabase
          .from('shows')
          .select('id')
          .eq('ticketmaster_id', event.id)
          .single();
        
        if (existingShow) {
          duplicatesSkipped++;
          continue;
        }
        
        // Prepare show data
        const showData = {
          ticketmaster_id: event.id,
          artist_id: artistId,
          venue_id: venueId,
          name: event.name,  // Fixed: use 'name' not 'title'
          date: event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`,
          status: 'upcoming',
          tickets_url: event.url,
          min_price: event.priceRanges?.[0]?.min || null,
          max_price: event.priceRanges?.[0]?.max || null,
          popularity: event.score || 50,
          sales_status: event.dates.status?.code,
          presale_date: event.sales?.presales?.[0]?.startDateTime || null,
          onsale_date: event.sales?.public?.startDateTime || null
        };
        
        console.log(`✅ Prepared show: ${showData.name} (Artist: ${artistId}, Venue: ${venueId})`);
        processedShows.push(showData);
        
      } catch (eventError) {
        console.warn(`Error processing event ${event.id}:`, eventError);
      }
    }
    
    // Bulk insert new shows in batches
    if (processedShows.length > 0) {
      console.log(`💾 Inserting ${processedShows.length} new shows...`);
      
      // Insert in batches of 100
      for (let i = 0; i < processedShows.length; i += 100) {
        const batch = processedShows.slice(i, i + 100);
        const { data: insertedShows, error: insertError } = await supabase
          .from('shows')
          .insert(batch)
          .select('id, artist_id');
        
        if (insertError) {
          console.error('❌ Error inserting shows batch:', insertError);
          console.error('❌ Failed batch data:', JSON.stringify(batch, null, 2));
          continue;
        }
        
        if (insertedShows) {
          newShowsStored += insertedShows.length;
          
          // Create initial setlists for new shows
          for (const show of insertedShows) {
            await supabase.rpc('create_initial_setlist_for_show', { 
              p_show_id: show.id
            });
          }
        }
      }
    }
    
    // Update sync state
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows_enhanced',
        last_sync_date: new Date().toISOString(),
        records_processed: allShows.length,
        records_created: newShowsStored,
        status: 'idle',
        updated_at: new Date().toISOString()
      });
    
    // Trigger homepage cache refresh
    await supabase.rpc('refresh_homepage_cache');
    
    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: 'Enhanced shows sync completed',
      stats: {
        eventsProcessed: allShows.length,
        newArtistsFound,
        newShowsStored,
        newVenuesCreated,
        artistsQueuedForSpotify: artistsQueued,
        duplicatesSkipped,
        pagesProcessed: page
      },
      duration,
    };
    
    console.log(`🎉 Enhanced shows sync completed in ${duration}ms`);
    console.log(`📊 Stats:`, response.stats);
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('💥 Critical error in enhanced shows sync:', error);
    
    // Update sync state to error
    const supabase = createServiceClient();
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows_enhanced',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      });
    
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
    // Mark artist as needing sync
    await supabase
      .from('artists')
      .update({ needs_spotify_sync: true })
      .eq('id', artistId);
      
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