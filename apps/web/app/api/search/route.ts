import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all'
  
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createRouteHandlerClient({ cookies })

  try {
    const results: any[] = []
    
    // Search artists
    if (type === 'all' || type === 'artists') {
      const { data: artistData } = await supabase
        .from('artists')
        .select('id, name, slug, image_url, genres, popularity')
        .ilike('name', `%${query}%`)
        .order('popularity', { ascending: false })
        .limit(5)
      
      if (artistData) {
        results.push(...artistData.map(artist => ({
          type: 'artist',
          id: artist.id,
          title: artist.name,
          image: artist.image_url,
          metadata: {
            genres: artist.genres,
            popularity: artist.popularity
          },
          href: `/artists/${artist.slug}`
        })))
      }
    }
    
    // Search shows
    if (type === 'all' || type === 'shows') {
      const { data: showData } = await supabase
        .from('shows')
        .select(`
          id,
          title,
          date,
          artists!inner(name, slug, image_url),
          venues!inner(name, city, state)
        `)
        .or(`title.ilike.%${query}%,artists.name.ilike.%${query}%`)
        .eq('status', 'upcoming')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)
      
      if (showData) {
        results.push(...showData.map(show => {
          const artist = Array.isArray(show.artists) ? show.artists[0] : show.artists
          const venue = Array.isArray(show.venues) ? show.venues[0] : show.venues
          
          return {
            type: 'show',
            id: show.id,
            title: show.title || `${artist?.name} at ${venue?.name}`,
            subtitle: artist?.name,
            image: artist?.image_url,
            metadata: {
              date: show.date,
              location: `${venue?.name}, ${venue?.city}, ${venue?.state}`
            },
            href: `/shows/${show.id}`
          }
        }))
      }
    }
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
} 