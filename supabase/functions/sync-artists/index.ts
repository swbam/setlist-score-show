import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

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
      console.error('Unauthorized artist sync request');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎪 Starting artist show sync job');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    // Get artists that need show data refresh (haven't been updated in 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, last_synced_at')
      .or(`last_synced_at.is.null,last_synced_at.lt.'${twentyFourHoursAgo.toISOString()}'`)
      .limit(20);

    if (artistsError) {
      throw new Error(`Failed to fetch artists: ${artistsError.message}`);
    }

    if (!artists || artists.length === 0) {
      console.log('✅ No artists need show sync');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No artists need show sync',
          processed: 0,
          duration: Date.now() - startTime,
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Syncing shows for ${artists.length} artists`);

    let processed = 0;
    let showsFound = 0;
    let showsStored = 0;
    const errors: string[] = [];

    for (const artist of artists) {
      try {
        console.log(`🎤 Syncing shows for: ${artist.name}`);
        
        // Search Ticketmaster for upcoming shows
        const searchUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
        searchUrl.searchParams.append('apikey', ticketmasterApiKey);
        searchUrl.searchParams.append('keyword', artist.name);
        searchUrl.searchParams.append('classificationName', 'Music');
        searchUrl.searchParams.append('size', '50');
        searchUrl.searchParams.append('sort', 'date,asc');
        searchUrl.searchParams.append('startDateTime', new Date().toISOString());

        const response = await fetch(searchUrl.toString());

        if (!response.ok) {
          if (response.status === 429) {
            console.warn('Rate limit hit, waiting...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          throw new Error(`Ticketmaster API error: ${response.status}`);
        }

        const data = await response.json();
        const events = data._embedded?.events || [];

        for (const event of events) {
          try {
            // Verify this is actually the artist we're looking for
            const eventArtistName = event.name.toLowerCase();
            const targetArtistName = artist.name.toLowerCase();
            
            if (!eventArtistName.includes(targetArtistName) && 
                !targetArtistName.includes(eventArtistName)) {
              continue;
            }

            showsFound++;

            // Check if show already exists
            const eventDate = event.dates?.start?.localDate || event.dates?.start?.dateTime?.split('T')[0];
            if (!eventDate) continue;

            const { data: existingShow } = await supabase
              .from('shows')
              .select('id')
              .eq('artist_id', artist.id)
              .eq('date', eventDate)
              .single();

            if (existingShow) {
              console.log(`ℹ️ Show already exists for ${artist.name} on ${eventDate}`);
              continue;
            }

            // Create or get venue
            const venueName = event._embedded?.venues?.[0]?.name || 'Unknown Venue';
            const venueCity = event._embedded?.venues?.[0]?.city?.name || 'Unknown City';
            const venueState = event._embedded?.venues?.[0]?.state?.stateCode || event._embedded?.venues?.[0]?.state?.name;
            const venueCountry = event._embedded?.venues?.[0]?.country?.name || 'Unknown Country';
            const venueLat = parseFloat(event._embedded?.venues?.[0]?.location?.latitude || '0');
            const venueLon = parseFloat(event._embedded?.venues?.[0]?.location?.longitude || '0');

            let venueId: string;
            const { data: existingVenue } = await supabase
              .from('venues')
              .select('id')
              .eq('name', venueName)
              .eq('city', venueCity)
              .single();

            if (existingVenue) {
              venueId = existingVenue.id;
            } else {
              const { data: newVenue, error: venueError } = await supabase
                .from('venues')
                .insert({
                  name: venueName,
                  city: venueCity,
                  state: venueState,
                  country: venueCountry,
                  latitude: venueLat,
                  longitude: venueLon,
                })
                .select('id')
                .single();

              if (venueError) throw venueError;
              venueId = newVenue.id;
            }

            // Create show
            const { error: showError } = await supabase
              .from('shows')
              .insert({
                artist_id: artist.id,
                venue_id: venueId,
                date: eventDate,
                name: event.name,
                ticketmaster_id: event.id,
                ticketmaster_url: event.url,
                image_url: event.images?.[0]?.url,
              });

            if (!showError) {
              showsStored++;
              console.log(`✅ Stored show for ${artist.name} on ${eventDate}`);
            } else {
              console.error(`Error storing show: ${showError.message}`);
            }

          } catch (error) {
            console.error(`Error processing event: ${error}`);
          }
        }

        // Update artist's last_synced_at timestamp
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);

        processed++;
        
        // Rate limiting between artists
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        processed++;
        const errorMsg = `${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`💥 Error syncing shows for ${artist.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${processed} artists, found ${showsFound} shows, stored ${showsStored} shows`,
      stats: {
        artists_processed: processed,
        shows_found: showsFound,
        shows_stored: showsStored,
        failed: errors.length,
        errors: errors.slice(0, 3),
      },
      duration,
    };

    console.log(`🎉 Show sync completed: ${processed} artists processed, ${showsStored} shows stored in ${duration}ms`);

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