import { runDailyArtistSync } from '../../src/services/backgroundJobs';

export default async function handler(req: Request): Promise<Response> {
  // Verify cron secret from Vercel environment variables
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: sync-artists started');
      
      // Use our enhanced background job system
      const result = await runDailyArtistSync();
      
      if (result.success) {
        console.log(`Cron job: sync-artists finished. ${result.message}`);
        return new Response(JSON.stringify({ 
          message: result.message,
          processingTime: result.processingTime,
          recordsProcessed: result.recordsProcessed
        }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        console.error('Cron job: sync-artists failed:', result.errorDetails);
        return new Response(JSON.stringify({ 
          message: 'Artist sync failed', 
          error: result.errorDetails 
        }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } catch (error: any) {
      console.error('Error in sync-artists cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}