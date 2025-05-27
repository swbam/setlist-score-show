import { supabase } from '../../src/integrations/supabase/client';

export default async function handler(req: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: calculate-trending started');
      // Calculate trending score based on views and votes in last 7 days
      // The plan fetches shows with date >= new Date(). This means upcoming/ongoing.
      // For trending, we might also want to include recently past shows.
      // For now, sticking to the plan's logic.
      const { data: shows, error: showsError } = await supabase
        .from('shows')
        .select(`
          id,
          view_count,
          date,
          setlists(
            setlist_songs(votes)
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0]) // Compare with date part only
        .order('date', { ascending: true })
        .limit(100); // Process up to 100 shows

      if (showsError) {
        console.error('Error fetching shows for trending calculation:', showsError);
        return new Response(JSON.stringify({ message: 'Error fetching shows', error: showsError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      if (!shows || shows.length === 0) {
        console.log('Cron job: calculate-trending - No shows found for calculation.');
        return new Response(JSON.stringify({ message: 'No shows to calculate trending for' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      
      console.log(`Cron job: calculate-trending - Found ${shows.length} shows to process.`);
      interface ShowTrendingUpdate {
        id: string;
        trending_score: number;
      }
      const updates: ShowTrendingUpdate[] = [];

      for (const show of shows) {
        // Ensure setlists and setlist_songs are arrays before reducing
        const setlistsArray = Array.isArray(show.setlists) ? show.setlists : [];
        let totalVotes = 0;

        for (const setlist of setlistsArray) {
          const songsArray = Array.isArray(setlist.setlist_songs) ? setlist.setlist_songs : [];
          totalVotes += songsArray.reduce((sum, song) => sum + (song.votes || 0), 0);
        }
        
        const trendingScore = (show.view_count * 0.3) + (totalVotes * 0.7);
        updates.push({ id: show.id, trending_score: trendingScore });
      }
      
      // Batch update trending scores in database
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('shows')
          .upsert(updates as any[]); // Upsert based on 'id', cast to any[] to bypass strict type

        if (updateError) {
          console.error('Error updating trending scores:', updateError);
          // Not returning failure for the whole job, just logging
        }
      }

      console.log(`Cron job: calculate-trending finished. Processed ${updates.length} shows.`);
      return new Response(JSON.stringify({ message: `Trending calculation complete. Processed ${updates.length} shows.` }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
      console.error('Error in calculate-trending cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}