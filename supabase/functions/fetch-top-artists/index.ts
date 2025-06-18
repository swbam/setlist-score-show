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
    console.log('🎤 Starting top artist fetch');
    
    const supabase = createServiceClient();
    const ticketmasterApiKey = Deno.env.get('TICKETMASTER_API_KEY');
    
    if (!ticketmasterApiKey) {
      throw new Error('TICKETMASTER_API_KEY not configured');
    }

    // Fetch top events across the US to get popular artists
    console.log('🔥 Fetching top events nationwide...');
    
    const topEventsUrl = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    topEventsUrl.searchParams.append('apikey', ticketmasterApiKey);
    topEventsUrl.searchParams.append('classificationName', 'Music');
    topEventsUrl.searchParams.append('countryCode', 'US');
    topEventsUrl.searchParams.append('size', '200'); // Get more events to find unique artists
    topEventsUrl.searchParams.append('sort', 'relevance,desc');
    topEventsUrl.searchParams.append('startDateTime', new Date().toISOString());
    
    // Get events for next 6 months
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    topEventsUrl.searchParams.append('endDateTime', endDate.toISOString());

    const response = await fetch(topEventsUrl.toString());

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];

    console.log(`📈 Found ${events.length} events to analyze`);

    // Extract unique artists with their show counts
    const artistMap = new Map();
    
    for (const event of events) {
      const attractions = event._embedded?.attractions || [];
      
      for (const attraction of attractions) {
        if (!attraction.id || !attraction.name) continue;
        
        const artistId = attraction.id;
        const eventDate = new Date(event.dates?.start?.localDate || event.dates?.start?.dateTime);
        
        if (artistMap.has(artistId)) {
          const existing = artistMap.get(artistId);
          existing.upcomingShowCount++;
          if (eventDate < existing.firstShowDate) {
            existing.firstShowDate = eventDate;
          }
        } else {
          artistMap.set(artistId, {
            id: artistId,
            name: attraction.name,
            imageUrl: attraction.images?.[0]?.url || null,
            upcomingShowCount: 1,
            firstShowDate: eventDate,
            genres: attraction.classifications?.[0]?.genre?.name ? [attraction.classifications[0].genre.name] : []
          });
        }
      }
    }

    const allArtists = Array.from(artistMap.values());
    console.log(`🎤 Found ${allArtists.length} unique artists`);

    // Get existing artists from our database
    const artistIds = allArtists.map(a => a.id);
    const { data: existingArtists, error: dbError } = await supabase
      .from('artists')
      .select('ticketmaster_id')
      .in('ticketmaster_id', artistIds);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const existingIds = new Set(existingArtists?.map(a => a.ticketmaster_id) || []);
    console.log(`📊 Found ${existingIds.size} artists already in database`);

    // Filter out existing artists and get top 50
    const newArtists = allArtists
      .filter(artist => !existingIds.has(artist.id))
      .sort((a, b) => b.upcomingShowCount - a.upcomingShowCount) // Sort by show count
      .slice(0, 50)
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        upcomingShowCount: artist.upcomingShowCount,
        firstShowDate: artist.firstShowDate.toISOString(),
        genres: artist.genres
      }));

    const duration = Date.now() - startTime;
    const result = {
      success: true,
      artists: newArtists,
      stats: {
        totalEventsAnalyzed: events.length,
        uniqueArtistsFound: allArtists.length,
        existingInDatabase: existingIds.size,
        newArtistsAvailable: newArtists.length
      },
      duration
    };

    console.log(`🎉 Found ${newArtists.length} new artists to import`);
    console.log(`📊 Top artist: ${newArtists[0]?.name} (${newArtists[0]?.upcomingShowCount} shows)`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in fetch top artists:', error);
    
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