const { createClient } = require('@supabase/supabase-js')

// Check env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Has anon key:', !!supabaseKey)
console.log('Has service key:', !!serviceKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    console.log('\n=== Testing get_trending_artists ===')
    const { data: artists, error: artistError } = await supabase.rpc('get_trending_artists', { p_limit: 5 })
    console.log('Artists result:', { data: artists, error: artistError })

    console.log('\n=== Testing get_top_shows ===')
    const { data: shows, error: showError } = await supabase.rpc('get_top_shows', { p_limit: 5 })
    console.log('Shows result:', { data: shows, error: showError })

    console.log('\n=== Testing populate_sample_data ===')
    const { data: populate, error: populateError } = await supabase.rpc('populate_sample_data')
    console.log('Populate result:', { data: populate, error: populateError })

    console.log('\n=== Basic table counts ===')
    const [artistCount, showCount, venueCount] = await Promise.all([
      supabase.from('artists').select('*', { count: 'exact', head: true }),
      supabase.from('shows').select('*', { count: 'exact', head: true }),
      supabase.from('venues').select('*', { count: 'exact', head: true })
    ])
    
    console.log('Table counts:', {
      artists: artistCount.count,
      shows: showCount.count,
      venues: venueCount.count
    })

  } catch (error) {
    console.error('Database check error:', error)
  }
}

checkDatabase()