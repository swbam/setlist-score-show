import { supabase } from '../../src/integrations/supabase/client';
import { importArtistCatalog } from '../../src/services/spotify';

export default async function handler(req: Request): Promise<Response> {
  // Verify cron secret from Vercel environment variables
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: sync-artists started');
      // Get artists needing update (not synced in 7 days or never synced)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('id, name, last_synced_at')
        .or(`last_synced_at.is.null,last_synced_at.lt.${sevenDaysAgo.toISOString()}`)
        .limit(10); // Process 10 artists per run to avoid long execution

      if (artistsError) {
        console.error('Error fetching artists for sync:', artistsError);
        return new Response(JSON.stringify({ message: 'Error fetching artists', error: artistsError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      if (!artists || artists.length === 0) {
        console.log('Cron job: sync-artists - No artists found needing an update.');
        return new Response(JSON.stringify({ message: 'No artists to sync' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      console.log(`Cron job: sync-artists - Found ${artists.length} artists to update.`);
      let successCount = 0;
      let failureCount = 0;

      for (const artist of artists) {
        try {
          console.log(`Syncing catalog for artist: ${artist.name} (ID: ${artist.id})`);
          // Pass true for forceFullCatalog if you want to ensure full catalog,
          // otherwise importArtistCatalog has its own logic for top tracks vs full.
          // The plan's original `importFullArtistCatalog` implies a full sync.
          // The existing `importArtistCatalog` has a `forceFullCatalog` param.
          // For a daily cron, `forceFullCatalog: false` (default) is probably fine to just refresh.
          // If the goal is a *deep* sync, then `true`. Let's assume default behavior is fine.
          const success = await importArtistCatalog(artist.id);
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (e) {
          failureCount++;
          console.error(`Error syncing artist ${artist.id}:`, e);
        }
      }

      console.log(`Cron job: sync-artists finished. Synced: ${successCount}, Failed: ${failureCount}`);
      return new Response(JSON.stringify({ message: `Sync complete. Synced: ${successCount}, Failed: ${failureCount}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
      console.error('Error in sync-artists cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}