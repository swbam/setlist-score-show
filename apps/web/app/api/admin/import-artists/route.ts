import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to import a single artist (reuses logic from import-artist route)
async function importSingleArtist(ticketmasterId: string, name: string, imageUrl?: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/import-artist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ticketmasterId,
      name,
      imageUrl,
      slug: createSlug(name)
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Import failed: ${error}`)
  }

  return await response.json()
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client to check admin status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { artists } = body // Array of { id, name, imageUrl }

    if (!Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'Artists array is required' }, { status: 400 })
    }

    console.log(`🎯 Starting bulk import of ${artists.length} artists`)

    const results = []
    
    // Process artists with rate limiting
    for (const artist of artists) {
      try {
        console.log(`🎤 Importing ${artist.name}...`)
        
        const result = await importSingleArtist(
          artist.id,
          artist.name,
          artist.imageUrl
        )
        
        results.push({
          id: artist.id,
          name: artist.name,
          status: 'success',
          artist: result.artist,
          message: result.message
        })
        
        console.log(`✅ Successfully imported ${artist.name}`)
        
        // Rate limiting - wait 500ms between imports to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`❌ Failed to import ${artist.name}:`, error)
        
        results.push({
          id: artist.id,
          name: artist.name,
          status: 'error',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    console.log(`🎉 Bulk import completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Imported ${successCount} of ${artists.length} artists`,
      results,
      stats: {
        total: artists.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Failed to import artists', details: error.message },
      { status: 500 }
    )
  }
} 