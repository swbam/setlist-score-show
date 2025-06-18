import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Body {
  type: string
  params?: any
}

const JOB_MAP: Record<string, string> = {
  setlistfm: 'sync-setlists',
  spotify: 'sync-spotify',
  ticketmaster: 'sync-top-shows',
  trending: 'calculate-trending',
  cleanup: 'cleanup-old-data',
  'refresh-materialized-views': 'refresh_trending_shows',
  artist: 'sync-artists'
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const body = (await req.json()) as Body
  const fn = JOB_MAP[body.type]
  if (!fn) {
    return NextResponse.json({ error: 'Unknown job type' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase.functions.invoke(fn, {
      body: body.params || {}
    })

    if (error) {
      console.error('Edge function invoke error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, result: data })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 