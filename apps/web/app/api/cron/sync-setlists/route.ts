import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Vercel cron or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🎸 Triggering setlist sync from cron...')

    // Trigger the setlist sync function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const functionUrl = `${supabaseUrl}/functions/v1/sync-setlists`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Setlist sync failed: ${result.error || response.statusText}`)
    }

    console.log('✅ Setlist sync completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Setlist sync triggered successfully',
      result
    })

  } catch (error) {
    console.error('❌ Setlist sync cron error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Setlist sync cron endpoint is active. Use POST to trigger sync.' 
  })
}