import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ artists: [], venues: [], shows: [] })
    }

    // Artists search
    const { data: artistsData } = await supabase
      .from('artists')
      .select('id,name,slug,image_url,genres')
      .ilike('name', `%${q}%`)
      .order('followers', { ascending: false })
      .limit(10)

    // Shows search (upcoming only)
    const { data: showsData } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        title,
        artists ( id, name, slug, image_url ),
        venues ( id, name, city )
      `)
      .ilike('title', `%${q}%`)
      .or(`artist_search.ilike.%${q}%`) // assume tsvector column maybe but fallback
      .eq('status', 'upcoming')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(10)

    // Venues search
    const { data: venuesData } = await supabase
      .from('venues')
      .select('id,name,city,state')
      .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(10)

    return NextResponse.json({
      artists: artistsData || [],
      shows: showsData || [],
      venues: venuesData || [],
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 