import { runImportSetlists } from '../../src/services/backgroundJobs';

export default async function handler(req: Request): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: import-setlists started');
      const startTime = Date.now();

      const result = await runImportSetlists();
      const processingTime = Date.now() - startTime;

      console.log(`Cron job: import-setlists finished in ${processingTime}ms`);

      if (result.success) {
        return new Response(JSON.stringify({ 
          message: `Setlist import complete. ${result.message || ''}`,
          processingTime,
          recordsProcessed: result.recordsProcessed,
          details: {
            successCount: (result as any).successCount || 0,
            failureCount: (result as any).failureCount || 0,
            totalShows: (result as any).totalShows || 0
          }
        }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        return new Response(JSON.stringify({ 
          message: 'Setlist import failed',
          error: result.errorDetails,
          processingTime,
          retryCount: result.retryCount
        }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

    } catch (error: any) {
      console.error('Error in import-setlists cron job:', error);
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