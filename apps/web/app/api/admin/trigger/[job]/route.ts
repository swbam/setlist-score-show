import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase-server';

const ALLOWED_JOBS = [
  'sync-homepage-orchestrator',
  'sync-top-shows', 
  'sync-artists',
  'sync-spotify',
  'calculate-trending',
  'refresh_trending_shows',
  'sync-setlists',
  'fetch-top-artists'
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: { job: string } }
) {
  try {
    // Check authentication
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate job name
    if (!ALLOWED_JOBS.includes(params.job as any)) {
      return NextResponse.json({ error: 'Invalid job' }, { status: 400 });
    }

    // Create service role client
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      const { data, error } = await serviceSupabase.functions.invoke(params.job, {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`
        }
      });

      if (error) throw error;

      return NextResponse.json({ 
        success: true, 
        job: params.job,
        data 
      });
    } catch (error) {
      console.error(`Failed to trigger ${params.job}:`, error);
      return NextResponse.json({ 
        error: `Failed to trigger job: ${error.message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error in admin trigger API:`, error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET for testing
export async function GET(
  req: NextRequest,
  { params }: { params: { job: string } }
) {
  return NextResponse.json({
    job: params.job,
    allowed: ALLOWED_JOBS.includes(params.job as any),
    allowed_jobs: ALLOWED_JOBS,
    method: 'Use POST to trigger this job'
  });
}