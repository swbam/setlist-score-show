import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Trigger the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-setlists`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.CRON_SECRET || ''
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Edge function failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Setlist sync triggered',
      result
    })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync setlists', details: error.message },
      { status: 500 }
    )
  }
}