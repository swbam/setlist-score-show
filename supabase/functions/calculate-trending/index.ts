import { serve } from "https://deno.land/std@0.208.0/http/server.ts"; // Matched version from refresh_trending_shows
import { createServiceClient } from '../_shared/supabase.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const authResponse = verifyAuth(req);
  if (authResponse) return authResponse;

  try {
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