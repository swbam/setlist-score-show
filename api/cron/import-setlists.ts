import { supabase } from '../../src/integrations/supabase/client';
import { importPlayedSetlist } from '../../src/services/setlistfm';

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: import-setlists started');

      // 1. Find shows that have occurred recently (e.g., in the last 24-48 hours)
      //    and do not yet have an entry in `played_setlists`.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Subquery to find show_ids that are already in played_setlists
      const { data: importedShowIds, error: importedError } = await supabase
        .from('played_setlists')
        .select('show_id');

      if (importedError) {
        console.error('Error fetching imported show IDs:', importedError);
        return new Response(JSON.stringify({ message: 'Error fetching imported show IDs', error: importedError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const showIdsToExclude = importedShowIds?.map(ps => ps.show_id) || [];
      
      const { data: showsToImport, error: showsError } = await supabase
        .from('shows')
        .select('id, name, date')
        .gte('date', twoDaysAgo.toISOString().split('T')[0]) // Occurred on or after two days ago
        .lte('date', new Date().toISOString().split('T')[0]) // Occurred on or before today (to catch shows from "yesterday" or "today morning")
        .not('id', 'in', `(${showIdsToExclude.join(',')})`) // Exclude already imported ones
        .order('date', { ascending: true }) // Process older ones first
        .limit(10); // Process 10 shows per run

      if (showsError) {
        console.error('Error fetching shows for setlist import:', showsError);
        return new Response(JSON.stringify({ message: 'Error fetching shows for import', error: showsError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      if (!showsToImport || showsToImport.length === 0) {
        console.log('Cron job: import-setlists - No recent shows found needing setlist import.');
        return new Response(JSON.stringify({ message: 'No shows to import setlists for' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      console.log(`Cron job: import-setlists - Found ${showsToImport.length} shows to import setlists for.`);
      let successCount = 0;
      let failureCount = 0;

      for (const show of showsToImport) {
        try {
          console.log(`Importing setlist for show: ${show.name} (ID: ${show.id}, Date: ${show.date})`);
          await importPlayedSetlist(show.id); // This function handles its own logging
          successCount++;
        } catch (e: any) {
          failureCount++;
          console.error(`Error importing setlist for show ${show.id}:`, e.message);
        }
      }

      console.log(`Cron job: import-setlists finished. Successful imports: ${successCount}, Failed attempts: ${failureCount}`);
      return new Response(JSON.stringify({ message: `Setlist import complete. Successful: ${successCount}, Failed: ${failureCount}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
      console.error('Error in import-setlists cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}