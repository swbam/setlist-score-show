import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Matched version from refresh_trending_shows
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify cron secret for scheduled runs or API key for manual runs
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET'); // Assuming Deno is available in runtime
    
    if (authHeader !== `Bearer ${cronSecret}` && 
        !req.headers.get('apikey')?.includes(Deno.env.get('SUPABASE_ANON_KEY') ?? '')) { // Assuming Deno is available
      console.error('Unauthorized trending calculation request');
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📈 Starting refresh of trending_shows materialized view');
    
    const supabase = createServiceClient();

    // Call the PostgreSQL function to refresh the materialized view
    const { error: rpcError } = await supabase.rpc('refresh_trending_shows');

    if (rpcError) {
      throw new Error(`Failed to refresh trending_shows materialized view: ${rpcError.message}`);
    }

    const duration = Date.now() - startTime;
    const responsePayload = {
      success: true,
      message: 'Successfully refreshed trending_shows materialized view.',
      duration,
    };

    console.log(`🎉 Trending materialized view refresh completed in ${duration}ms`);

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error in trending materialized view refresh:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});