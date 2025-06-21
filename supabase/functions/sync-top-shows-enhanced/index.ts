import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const TICKETMASTER_API_KEY = Deno.env.get('TICKETMASTER_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('Starting enhanced sync for top shows...');
    
    // Fetch shows in batches (50 per page, max 100 total)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let page = 0;
    let hasMore = true;
    const allShows = [];
    
    while (hasMore && page < 2 && allShows.length < 100) { // Max 2 pages = 100 shows
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events?` +
        `apikey=${TICKETMASTER_API_KEY}` +
        `&countryCode=US` +
        `&classificationName=Music` +
        `&startDateTime=${startDate}T00:00:00Z` +
        `&endDateTime=${endDate}T23:59:59Z` +
        `&size=50` + // 50 per page
        `&page=${page}` +
        `&sort=relevance,desc` +
        `&includeTBA=no` +
        `&includeTBD=no`
      );
      
      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data._embedded?.events) {
        allShows.push(...data._embedded.events);
        console.log(`Added ${data._embedded.events.length} shows, total: ${allShows.length}`);
      }
      
      hasMore = data.page.number < data.page.totalPages - 1 && allShows.length < 100;
      page++;
    }
    
    console.log(`Fetched ${allShows.length} shows from Ticketmaster`);
    
    // Process shows with deduplication
    const processedShows = [];
    const venueMap = new Map();
    const artistMap = new Map();
    
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
            // Create new venue
            const { data: newVenue, error: venueError } = await supabase
              .from('venues')
              .insert({
                ticketmaster_id: venueData.id,
                name: venueData.name,
                city: venueData.city?.name,
                state: venueData.state?.stateCode,
                country: venueData.country?.countryCode || 'US',
                address: venueData.address?.line1,
                capacity: venueData.generalInfo?.generalRule?.match(/\d+/)?.[0] ? 
                  parseInt(venueData.generalInfo.generalRule.match(/\d+/)[0]) : null,
                postal_code: venueData.postalCode,
                longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null,
                latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null
              })
              .select('id')
              .single();
            
            if (venueError) {
              console.error('Error creating venue:', venueError);
              continue;
            }
            
            venueId = newVenue.id;
          }
          venueMap.set(venueData.id, venueId);
        }
        
        // Process artist
        const attraction = attractions[0];
        let artistId = artistMap.get(attraction.id);
        
        if (!artistId) {
          const { data: existingArtist } = await supabase
            .from('artists')
            .select('id')
            .eq('ticketmaster_id', attraction.id)
            .single();
          
          if (existingArtist) {
            artistId = existingArtist.id;
          } else {
            // Create artist with better metadata
            const slug = attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            
            const { data: newArtist, error: artistError } = await supabase
              .from('artists')
              .insert({
                ticketmaster_id: attraction.id,
                name: attraction.name,
                slug: slug,
                image_url: attraction.images?.find(img => img.ratio === '16_9' || img.ratio === '4_3')?.url,
                genres: attraction.classifications?.[0]?.genre?.name ? 
                  [attraction.classifications[0].genre.name] : [],
                popularity: Math.floor(Math.random() * 50) + 50, // Temporary until Spotify sync
                needs_spotify_sync: true
              })
              .select('id')
              .single();
            
            if (artistError) {
              console.error('Error creating artist:', artistError);
              continue;
            }
            
            artistId = newArtist.id;
          }
          artistMap.set(attraction.id, artistId);
        }
        
        // Check if show already exists
        const { data: existingShow } = await supabase
          .from('shows')
          .select('id')
          .eq('ticketmaster_id', event.id)
          .single();
        
        if (!existingShow) {
          const showDate = event.dates.start.dateTime || `${event.dates.start.localDate}T20:00:00Z`;
          
          processedShows.push({
            ticketmaster_id: event.id,
            artist_id: artistId,
            venue_id: venueId,
            name: event.name,
            date: showDate,
            status: 'upcoming',
            tickets_url: event.url,
            min_price: event.priceRanges?.[0]?.min,
            max_price: event.priceRanges?.[0]?.max,
            popularity: event.score || 50,
            sales_status: event.dates.status.code,
            presale_date: event.sales?.presales?.[0]?.startDateTime,
            onsale_date: event.sales?.public?.startDateTime
          });
        }
      } catch (error) {
        console.error('Error processing event:', error);
        continue;
      }
    }
    
    console.log(`Processed ${processedShows.length} new shows`);
    
    // Bulk insert new shows
    if (processedShows.length > 0) {
      const { data: insertedShows, error: insertError } = await supabase
        .from('shows')
        .insert(processedShows)
        .select('id, artist_id');
      
      if (insertError) {
        throw new Error(`Error inserting shows: ${insertError.message}`);
      }
      
      console.log(`Inserted ${insertedShows.length} shows`);
      
      // Create initial setlists for new shows
      for (const show of insertedShows) {
        try {
          await supabase.rpc('create_initial_setlist', { 
            p_show_id: show.id,
            p_artist_id: show.artist_id 
          });
        } catch (error) {
          console.error('Error creating initial setlist:', error);
        }
      }
      
      console.log('Created initial setlists for new shows');
    }
    
    // Update sync state
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows_enhanced',
        last_sync_date: new Date().toISOString(),
        records_processed: allShows.length,
        records_created: processedShows.length,
        status: 'success'
      });
    
    // Refresh homepage cache
    try {
      await supabase.rpc('refresh_homepage_cache');
      console.log('Homepage cache refreshed');
    } catch (error) {
      console.error('Error refreshing homepage cache:', error);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      processed: allShows.length,
      created: processedShows.length,
      message: 'Enhanced sync completed successfully'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    
    // Update sync state with error
    await supabase
      .from('sync_state')
      .upsert({
        job_name: 'ticketmaster_shows_enhanced',
        last_sync_date: new Date().toISOString(),
        status: 'error',
        error_message: error.message
      });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});