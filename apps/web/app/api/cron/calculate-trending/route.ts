import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify request is from Vercel cron or authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Triggering trending calculation from cron...')

    // Trigger the trending calculation function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const functionUrl = `${supabaseUrl}/functions/v1/calculate-trending`
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Trending calculation failed: ${result.error || response.statusText}`)
    }

    console.log('✅ Trending calculation completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Trending calculation triggered successfully',
      result
    })

  } catch (error) {
    console.error('❌ Trending calculation cron error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Trending calculation cron endpoint is active. Use POST to trigger calculation.' 
  })
}