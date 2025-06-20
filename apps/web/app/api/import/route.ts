import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ImportArtistRequest {
  type: 'artist'
  spotify_id: string
  name: string
  popularity: number
  followers: number
  genres: string[]
  image_url: string | null
  spotify_url: string
}

interface ImportShowRequest {
  type: 'show'
  ticketmaster_id: string
  name: string
  artist_name: string
  artist_image: string | null
  venue_name: string
  venue_city: string
  venue_state: string
  date: string
  status: string
  ticket_url: string
  min_price?: number
  max_price?: number
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function importArtist(data: ImportArtistRequest) {
  // Check if artist already exists
  const { data: existing } = await supabase
    .from('artists')
    .select('id, slug')
    .eq('spotify_id', data.spotify_id)
    .single()

  if (existing) {
    return { success: true, artist_id: existing.id, slug: existing.slug, created: false }
  }

  // Create new artist
  const slug = generateSlug(data.name)
  const { data: artist, error } = await supabase
    .from('artists')
    .insert({
      spotify_id: data.spotify_id,
      name: data.name,
      slug,
      image_url: data.image_url,
      genres: data.genres,
      popularity: data.popularity,
      followers: data.followers,
      last_synced_at: new Date().toISOString()
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('Error creating artist:', error)
    throw new Error('Failed to create artist')
  }

  // Trigger Spotify catalog sync in background (if we have that setup)
  // This would populate the artist's songs
  
  return { success: true, artist_id: artist.id, slug: artist.slug, created: true }
}

async function importShow(data: ImportShowRequest) {
  // First, get or create the artist
  let artistId: string
  
  const { data: existingArtist } = await supabase
    .from('artists')
    .select('id')
    .ilike('name', data.artist_name)
    .single()

  if (existingArtist) {
    artistId = existingArtist.id
  } else {
    // Create minimal artist record
    const { data: newArtist, error: artistError } = await supabase
      .from('artists')
      .insert({
        name: data.artist_name,
        slug: generateSlug(data.artist_name),
        image_url: data.artist_image,
        popularity: 50, // Default
        needs_spotify_sync: true
      })
      .select('id')
      .single()

    if (artistError || !newArtist) {
      throw new Error('Failed to create artist')
    }
    artistId = newArtist.id
  }

  // Get or create venue
  let venueId: string
  
  const { data: existingVenue } = await supabase
    .from('venues')
    .select('id')
    .ilike('name', data.venue_name)
    .eq('city', data.venue_city)
    .eq('state', data.venue_state)
    .single()

  if (existingVenue) {
    venueId = existingVenue.id
  } else {
    const { data: newVenue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: data.venue_name,
        city: data.venue_city,
        state: data.venue_state,
        country: 'US'
      })
      .select('id')
      .single()

    if (venueError || !newVenue) {
      throw new Error('Failed to create venue')
    }
    venueId = newVenue.id
  }

  // Check if show already exists
  const { data: existingShow } = await supabase
    .from('shows')
    .select('id')
    .eq('ticketmaster_id', data.ticketmaster_id)
    .single()

  if (existingShow) {
    return { success: true, show_id: existingShow.id, created: false }
  }

  // Create the show
  const { data: show, error: showError } = await supabase
    .from('shows')
    .insert({
      ticketmaster_id: data.ticketmaster_id,
      artist_id: artistId,
      venue_id: venueId,
      name: data.name,
      date: data.date,
      status: 'upcoming',
      tickets_url: data.ticket_url,
      min_price: data.min_price,
      max_price: data.max_price
    })
    .select('id')
    .single()

  if (showError || !show) {
    throw new Error('Failed to create show')
  }

  // Create initial setlist with placeholder songs
  try {
    const { error: setlistError } = await supabase.rpc('create_initial_setlist', {
      show_id: show.id,
      artist_id: artistId
    })

    if (setlistError) {
      console.error('Error creating initial setlist:', setlistError)
      // Don't fail the import, just log the error
    }
  } catch (error) {
    console.error('Error calling create_initial_setlist:', error)
    // Don't fail the import
  }

  return { success: true, show_id: show.id, created: true }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.type === 'artist') {
      const result = await importArtist(data as ImportArtistRequest)
      return NextResponse.json(result)
    } else if (data.type === 'show') {
      const result = await importShow(data as ImportShowRequest)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'Invalid import type' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}