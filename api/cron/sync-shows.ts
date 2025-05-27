import { supabase } from '../../src/integrations/supabase/client';
import { getArtistEvents, storeVenueInDatabase, storeShowInDatabase, TicketmasterEvent, TicketmasterVenue, TicketmasterAttraction } from '../../src/services/ticketmaster';
import { mapTicketmasterToSpotify } from '../../src/services/artistMapping'; // To map TM artist to Spotify ID

interface ArtistForShowSync {
  id: string;
  name: string;
  ticketmaster_name?: string | null; // Make optional as it might not always be populated
}

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: sync-shows started');

      // 1. Fetch a list of artists to sync shows for.
      // For simplicity, let's fetch a few artists who were synced for their catalog recently.
      // A more robust strategy might involve looking at artists with upcoming shows or round-robin.
      const { data: artistsToSync, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, ticketmaster_name') // Assuming 'name' is Spotify name, 'ticketmaster_name' might be present
        .order('last_synced_at', { ascending: false, nullsFirst: false }) // Get recently synced ones
        .limit(5); // Process 5 artists per run

      if (artistsError) {
        console.error('Error fetching artists for show sync:', artistsError);
        return new Response(JSON.stringify({ message: 'Error fetching artists', error: artistsError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      if (!artistsToSync || artistsToSync.length === 0) {
        console.log('Cron job: sync-shows - No artists found to sync shows for.');
        return new Response(JSON.stringify({ message: 'No artists to sync shows for' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      console.log(`Cron job: sync-shows - Found ${artistsToSync.length} artists to process.`);
      let showsProcessed = 0;
      let showsStored = 0;
// Removed duplicate: let showsStored = 0;

for (const artistRaw of artistsToSync) {
  const artist = artistRaw as unknown as ArtistForShowSync; // More forceful cast

  // Use ticketmaster_name if available, otherwise Spotify name for searching TM
  const tmSearchName = artist.ticketmaster_name || artist.name;
  if (!tmSearchName) continue;

  console.log(`Fetching Ticketmaster events for artist: ${tmSearchName} (DB ID: ${artist.id})`);
  const events = await getArtistEvents(tmSearchName);

  for (const event of events) {
    showsProcessed++;
    const venueData = event._embedded?.venues?.[0];
    const attractionData = event._embedded?.attractions?.[0];

    if (!venueData || !attractionData) {
      console.warn(`Event ${event.id} for ${tmSearchName} is missing venue or attraction data. Skipping.`);
      continue;
    }

    // 2. Store/Update Venue
    const venueStored = await storeVenueInDatabase(venueData as TicketmasterVenue);
    if (!venueStored) {
      console.warn(`Failed to store venue ${venueData.id} for event ${event.id}. Skipping show storage.`);
      continue;
    }

    // 3. Map Ticketmaster artist to our internal (Spotify) artist ID
    // The event's main attraction should be the artist we're interested in.
    let finalArtistId = artist.id; // Default to the artist ID we are iterating on
          // If the attraction name significantly differs, or if we want to be more precise,
          // we could use mapTicketmasterToSpotify.
          // For this cron, we assume the events fetched are for the 'artist.id' we started with.
          // However, if the attractionData.name is different, it might be a collaboration.
          // The `mapTicketmasterToSpotify` is more for initial mapping.
          // Here, we trust `getArtistEvents` fetched events for `artist.name`.

          // 4. Store/Update Show
          // The `artistId` for `storeShowInDatabase` should be our internal Spotify-based ID.
          const showStored = await storeShowInDatabase(event, finalArtistId, venueData.id);
          if (showStored) {
            showsStored++;
          }
        }
        // Optional: Add a small delay between processing artists if hitting rate limits
        // await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Cron job: sync-shows finished. Processed ${showsProcessed} events, Stored/Updated ${showsStored} shows.`);
      return new Response(JSON.stringify({ message: `Show sync complete. Processed events: ${showsProcessed}, Stored/Updated shows: ${showsStored}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
      console.error('Error in sync-shows cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}