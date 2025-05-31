import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request) {
  // Calculate trending score based on views and votes in last 7 days
  const { data: shows } = await supabase
    .from('shows')
    .select(`
      *,
      setlist:setlists(
        setlist_songs(votes)
      )
    `)
    .gte('date', new Date())
    .order('date', { ascending: true })
    .limit(100);

  const trending = (shows || []).map(show => {
    const totalVotes = show.setlist?.setlist_songs?.reduce(
      (sum, song) => sum + song.votes, 0
    ) || 0;

    const trending_score = (show.view_count * 0.3 + totalVotes * 0.7);
    
    return {
      id: show.id,
      trending_score
    };
  });

  // Update trending scores in database
  for (const show of trending) {
    await supabase
      .from('shows')
      .update({ trending_score: show.trending_score })
      .eq('id', show.id);
  }

  return new Response('OK');
}