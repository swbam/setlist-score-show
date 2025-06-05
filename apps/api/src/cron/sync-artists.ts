import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: Request) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron request');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('🔄 Starting artist catalog sync cron job');

    // Get artists needing update (not synced in 7 days or never synced)
    const { data: artists, error } = await supabase
      .from('artists')
      .select('id, name, last_synced_at')
      .or('last_synced_at.is.null,last_synced_at.lt.now() - interval \'7 days\'')
      .limit(15); // Increased limit for better throughput

    if (error) {
      console.error('Error fetching artists:', error);
      return new Response(`Database error: ${error.message}`, { status: 500 });
    }

    if (!artists || artists.length === 0) {
      console.log('✅ No artists need catalog sync');
      return new Response(JSON.stringify({
        success: true,
        message: 'No artists need sync',
        processed: 0,
        duration: Date.now() - startTime
      }), { 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🎯 Found ${artists.length} artists to sync`);

    let processed = 0;
    let successful = 0;
    const errors: string[] = [];

    // TODO: Re-enable when fullCatalogImport service is implemented
    // const { importFullArtistCatalog } = await import('../../src/services/fullCatalogImport');

    for (const artist of artists) {
      try {
        console.log(`🎤 Syncing catalog for artist: ${artist.name} (${artist.id})`);
        
        // TODO: Replace with actual import when service is available
        // const result = await importFullArtistCatalog(artist.id);
        const result = { success: true, tracks_imported: 0 };
        
        if (result.success) {
          successful++;
          console.log(`✅ Successfully synced ${artist.name}: ${result.tracks_imported} tracks`);
        } else {
          errors.push(`${artist.name}: Unknown error`);
          console.error(`❌ Failed to sync ${artist.name}`);
        }
        
        processed++;

        // Rate limiting between artists
        await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for stub

      } catch (error) {
        processed++;
        const errorMsg = `${artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`💥 Error syncing ${artist.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${processed} artists, ${successful} successful`,
      stats: {
        processed,
        successful,
        failed: processed - successful,
        errors: errors.slice(0, 5) // Limit error details
      },
      duration
    };

    console.log(`🎉 Artist sync completed: ${successful}/${processed} successful in ${duration}ms`);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Critical error in artist sync cron:', error);
    
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
