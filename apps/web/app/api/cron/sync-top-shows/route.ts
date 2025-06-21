import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify request is from authorized source (in production, use proper auth)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Triggering enhanced sync for top shows...')

    // Trigger the enhanced sync function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const functionUrl = `${supabaseUrl}/functions/v1/sync-top-shows-enhanced`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Sync failed: ${result.error || 'Unknown error'}`)
    }

    console.log('✅ Sync completed successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully',
      data: result
    })

  } catch (error) {
    console.error('❌ Sync trigger error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow GET for easy testing
export async function GET() {
  return POST(new NextRequest('http://localhost/api/cron/sync-top-shows', { method: 'POST' }))
} 