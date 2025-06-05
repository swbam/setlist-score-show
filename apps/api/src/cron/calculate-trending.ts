import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request) {
  // TEMPORARILY DISABLED - Performance issue fix
  return new Response('Cron job temporarily disabled for performance optimization', { status: 200 });
  
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized trending calculation cron request');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('📈 Starting trending score calculation cron job');

    // Get upcoming shows (next 30 days) for trending calculation
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artist:artists!shows_artist_id_fkey (
          name
        ),
        setlists!shows_id_fkey (
          id,
          setlist_songs!setlists_id_fkey (
            votes
          )
        )
      `)
      .gte('date', new Date().toISOString())
      .lte('date', thirtyDaysFromNow.toISOString())
      .order('date', { ascending: true });

    if (showsError) {
      console.error('Error fetching shows for trending calculation:', showsError);
      return new Response(`Database error: ${showsError.message}`, { status: 500 });
    }

    if (!shows || shows.length === 0) {
      console.log('✅ No upcoming shows found for trending calculation');
      return new Response(JSON.stringify({
        success: true,
        message: 'No upcoming shows to process',
        processed: 0,
        duration: Date.now() - startTime
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎯 Calculating trending scores for ${shows.length} upcoming shows`);

    let processed = 0;
    let updated = 0;
    const errors: string[] = [];

    // Calculate trending scores
    for (const show of shows) {
      try {
        // Calculate total votes for the show
        const totalVotes = show.setlists?.[0]?.setlist_songs?.reduce(
          (sum: number, song: any) => sum + (song.votes || 0), 0
        ) || 0;

        // Enhanced trending score calculation
        const viewCount = show.view_count || 0;
        const daysUntilShow = Math.max(1, Math.ceil((new Date(show.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        
        // Score factors:
        // - View count (30%)
        // - Total votes (50%) 
        // - Recency boost (20%) - higher for shows happening sooner
        const recencyBoost = Math.max(1, 31 - daysUntilShow) / 30; // 1.0 for tomorrow, decreasing to ~0.03 for 30 days out
        
        const trending_score = Math.round(
          (viewCount * 0.3) + 
          (totalVotes * 0.5) + 
          (recencyBoost * 100 * 0.2)
        );

        // Update the show's trending score
        const { error: updateError } = await supabase
          .from('shows')
          .update({ trending_score })
          .eq('id', show.id);

        if (updateError) {
          const artistName = Array.isArray(show.artist) ? show.artist[0]?.name : (show.artist as any)?.name;
          errors.push(`${artistName || 'Unknown'}: ${updateError.message}`);
          console.error(`❌ Error updating trending score for show ${show.id}:`, updateError);
        } else {
          updated++;
          const artistName = Array.isArray(show.artist) ? show.artist[0]?.name : (show.artist as any)?.name;
          console.log(`✅ Updated trending score for ${artistName || 'Unknown'} (${show.date}): ${trending_score}`);
        }

        processed++;

      } catch (error) {
        processed++;
        const artistName = Array.isArray(show.artist) ? show.artist[0]?.name : (show.artist as any)?.name;
        const errorMsg = `${artistName || 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`💥 Error processing show ${show.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${processed} shows, updated ${updated} trending scores`,
      stats: {
        processed,
        updated,
        failed: processed - updated,
        errors: errors.slice(0, 5) // Limit error details
      },
      duration
    };

    console.log(`🎉 Trending calculation completed: ${updated}/${processed} successful in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Critical error in trending calculation cron:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}