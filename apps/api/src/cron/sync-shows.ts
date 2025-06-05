import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized show sync cron request');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Unauthorized' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🎪 Starting show sync cron job');

    // Get artists that need show data refresh (haven't been updated in 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, last_synced_at')
      .or(`last_synced_at.is.null,last_synced_at.lt.'${twentyFourHoursAgo.toISOString()}'`)
      .limit(20); // Process up to 20 artists per run

    if (artistsError) {
      console.error('Error fetching artists for show sync:', artistsError);
      return new Response(JSON.stringify({
        success: false,
        error: `Database error: ${artistsError.message}`
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!artists || artists.length === 0) {
      console.log('✅ No artists need show sync');
      return new Response(JSON.stringify({
        success: true,
        message: 'No artists need show sync',
        processed: 0,
        duration: Date.now() - startTime
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎯 Syncing shows for ${artists.length} artists`);

    // TODO: Re-enable when search service is implemented
    // const { searchShows } = await import('../../src/services/search');
    
    let processed = 0;
    let showsFound = 0;
    let showsStored = 0;
    const errors: string[] = [];

    for (const artist of artists) {
      try {
        console.log(`🎤 Syncing shows for artist: ${artist.name} (${artist.id})`);
        
        // TODO: Replace with actual search when service is available
        // const searchResults = await searchShows(artist.name, {
        //   location: '', // Search globally
        //   dateRange: 'upcoming',
        //   limit: 50
        // });
        const searchResults: any[] = []; // Stub for now

        processed++;
        
        if (searchResults.length > 0) {
          showsFound += searchResults.length;
          
          // Filter for shows by this specific artist (fuzzy matching)
          const artistShows = searchResults.filter((show: any) => 
            show.artist_name.toLowerCase().includes(artist.name.toLowerCase()) ||
            artist.name.toLowerCase().includes(show.artist_name.toLowerCase())
          );
          
          showsStored += artistShows.length;
          
          console.log(`🎪 Found ${artistShows.length} shows for ${artist.name}`);
        } else {
          console.log(`ℹ️ No upcoming shows found for ${artist.name}`);
        }

        // Update artist's last_synced_at timestamp
        await supabase
          .from('artists')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', artist.id);

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
      message: `Processed ${processed} artists, found ${showsFound} shows, stored ${showsStored} artist-specific shows`,
      stats: {
        artists_processed: processed,
        shows_found: showsFound,
        shows_stored: showsStored,
        failed: errors.length,
        errors: errors.slice(0, 3) // Limit error details
      },
      duration
    };

    console.log(`🎉 Show sync completed: ${processed} artists processed, ${showsStored} shows stored in ${duration}ms`);
    
    if (errors.length > 0) {
      console.warn(`⚠️ Encountered ${errors.length} errors:`, errors.slice(0, 3));
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Critical error in show sync cron:', error);
    
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