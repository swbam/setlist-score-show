import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key for backend operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TICKETMASTER_API_KEY = process.env.VITE_TICKETMASTER_API_KEY;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting trends sync...');
    
    // Fetch popular events from Ticketmaster
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("apikey", TICKETMASTER_API_KEY!);
    url.searchParams.append("size", "20");
    url.searchParams.append("classificationName", "music");
    url.searchParams.append("sort", "relevance,desc");
    
    const tmResponse = await fetch(url.toString());
    
    if (!tmResponse.ok) {
      throw new Error(`Ticketmaster API error: ${tmResponse.status}`);
    }
    
    const data = await tmResponse.json();
    const events = data._embedded?.events || [];
    
    let processedCount = 0;
    
    for (const event of events) {
      if (!event._embedded?.attractions?.[0] || !event._embedded?.venues?.[0]) continue;
      
      const artist = event._embedded.attractions[0];
      const venue = event._embedded.venues[0];
      
      // Store venue
      const venueData = {
        id: venue.id,
        name: venue.name,
        city: venue.city?.name || '',
        state: venue.state?.name || null,
        country: venue.country?.name || '',
        address: venue.address?.line1 || null,
        latitude: venue.location?.latitude || null,
        longitude: venue.location?.longitude || null
      };
      
      await supabase
        .from('venues')
        .upsert(venueData, { onConflict: 'id' });
      
      // Check if we have a Spotify mapping for this artist
      const { data: artistMapping } = await supabase
        .from('artist_mappings')
        .select('spotify_id')
        .eq('ticketmaster_id', artist.id)
        .maybeSingle();
      
      let artistId = artistMapping?.spotify_id;
      
      if (!artistId) {
        // Try to find artist by name
        const { data: artistByName } = await supabase
          .from('artists')
          .select('id')
          .ilike('name', artist.name)
          .maybeSingle();
          
        artistId = artistByName?.id;
      }
      
      if (artistId) {
        // Store show
        const showData = {
          id: event.id,
          artist_id: artistId,
          venue_id: venue.id,
          name: event.name || null,
          date: event.dates?.start?.dateTime || null,
          start_time: event.dates?.start?.localTime || null,
          status: event.dates?.status?.code === 'cancelled' ? 'canceled' : 
                 event.dates?.status?.code === 'postponed' ? 'postponed' : 'scheduled',
          ticketmaster_url: event.url || null
        };
        
        await supabase
          .from('shows')
          .upsert(showData, { onConflict: 'id' });
        
        processedCount++;
      }
    }
    
    console.log(`Processed ${processedCount} trending events`);
    
    return response.status(200).json({ 
      success: true, 
      processed: processedCount,
      total: events.length 
    });
  } catch (error) {
    console.error('Error in trends sync:', error);
    return response.status(500).json({ error: error.message });
  }
}