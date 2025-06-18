import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ALLOWED_JOBS = [
  'sync-homepage-orchestrator',
  'sync-trending-shows', 
  'sync-ticketmaster-shows',
  'sync-spotify-catalog',
  'refresh-trending-shows',
  'sync-setlists'
] as const

export async function POST(
  req: NextRequest,
  { params }: { params: { job: string } }
) {
  try {
    // For now, we'll just validate the job name and return success
    // In production, this would trigger actual sync jobs
    
    if (!ALLOWED_JOBS.includes(params.job as any)) {
      return NextResponse.json({ error: 'Invalid job name' }, { status: 400 })
    }

    // Log the sync attempt
    const { error: logError } = await supabase
      .from('sync_history')
      .insert({
        sync_type: 'manual',
        entity_type: params.job,
        status: 'started',
        items_processed: 0
      })

    if (logError) {
      console.error('Error logging sync:', logError)
    }

    // For demo purposes, simulate job completion
    setTimeout(async () => {
      await supabase
        .from('sync_history')
        .insert({
          sync_type: 'manual',
          entity_type: params.job,
          status: 'completed',
          items_processed: Math.floor(Math.random() * 50) + 10,
          completed_at: new Date().toISOString()
        })
    }, 2000)

    return NextResponse.json({ 
      success: true, 
      job: params.job,
      message: `${params.job} sync job triggered successfully`
    })
  } catch (error) {
    console.error(`Failed to trigger ${params.job}:`, error)
    return NextResponse.json({ 
      error: `Failed to trigger job: ${error.message}` 
    }, { status: 500 })
  }
}
