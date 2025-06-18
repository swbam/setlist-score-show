import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  // Fetch last run data from sync_state if exists
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')

  if (error) {
    console.error('Failed to load sync state', error)
    return NextResponse.json({ error: 'Failed to load sync state' }, { status: 500 })
  }

  // Massage into keyed object expected by DataSync component
  const map: Record<string, any> = {}
  data?.forEach((row: any) => {
    map[row.job_name] = {
      status: row.status,
      lastSync: row.last_sync_date
    }
  })

  return NextResponse.json({
    setlistfm: map['sync-setlists'] || {},
    spotify: map['sync-spotify'] || {},
    ticketmaster: map['sync-top-shows'] || {},
    schedules: []
  })
} 