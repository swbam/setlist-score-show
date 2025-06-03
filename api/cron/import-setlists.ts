export default async function handler(req: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized setlist import cron request');
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Unauthorized' 
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🎭 Starting setlist import cron job');

    // Import the setlist.fm service
    const { batchImportRecentSetlists } = await import('../../src/services/setlistfm');
    
    // Import setlists from the last 7 days
    const result = await batchImportRecentSetlists(7);
    
    const duration = Date.now() - startTime;
    const response = {
      success: true,
      message: `Processed ${result.processed} shows, imported ${result.imported} setlists`,
      stats: {
        processed: result.processed,
        imported: result.imported,
        failed: result.processed - result.imported,
        errors: result.errors.slice(0, 3) // Limit error details
      },
      duration
    };

    console.log(`🎉 Setlist import completed: ${result.imported}/${result.processed} successful in ${duration}ms`);
    
    if (result.errors.length > 0) {
      console.warn(`⚠️ Encountered ${result.errors.length} errors:`, result.errors.slice(0, 3));
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Critical error in setlist import cron:', error);
    
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