import { supabase } from '../../src/integrations/supabase/client';
import { runTrendingCalculation } from '../../src/services/backgroundJobs';

export default async function handler(req: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method === 'POST') {
    try {
      console.log('Cron job: calculate-trending started');
      
      // Use our enhanced background job system
      const result = await runTrendingCalculation();
      
      if (result.success) {
        console.log(`Cron job: calculate-trending finished. ${result.message}`);
        return new Response(JSON.stringify({ 
          message: result.message,
          processingTime: result.processingTime,
          recordsProcessed: result.recordsProcessed
        }), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        });
      } else {
        console.error('Cron job: calculate-trending failed:', result.errorDetails);
        return new Response(JSON.stringify({ 
          message: 'Trending calculation failed', 
          error: result.errorDetails 
        }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
    } catch (error: any) {
      console.error('Error in calculate-trending cron job:', error);
      return new Response(JSON.stringify({ message: 'Cron job failed', error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Allow': 'POST' } });
  }
}