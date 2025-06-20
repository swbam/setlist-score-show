import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase
    .from('sync_history')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('History fetch error', error)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }

  return NextResponse.json(data || [])
} 