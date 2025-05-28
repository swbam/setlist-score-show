import { runSyncShows } from '../../src/services/backgroundJobs';

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: sync-shows started');
      const startTime = Date.now();

      const result = await runSyncShows();
      const processingTime = Date.now() - startTime;

      console.log(`Cron job: sync-shows finished in ${processingTime}ms`);

      if (result.success) {
        return new Response(JSON.stringify({ 
          message: `Show sync complete. ${result.message || ''}`,
          processingTime,
          recordsProcessed: result.recordsProcessed,
          details: {
            showsProcessed: (result as any).showsProcessed || 0,
            showsStored: (result as any).showsStored || 0,
            artistsProcessed: (result as any).artistsProcessed || 0
          }
        }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        return new Response(JSON.stringify({ 
          message: 'Show sync failed',
          error: result.errorDetails,
          processingTime,
          retryCount: result.retryCount
        }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

    } catch (error: any) {
      console.error('Error in sync-shows cron job:', error);
      return new Response(JSON.stringify({ 
        message: 'Cron job failed', 
        error: error.message 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}