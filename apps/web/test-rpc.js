// Test RPC functions directly
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing with URL:', supabaseUrl)
console.log('Has anon key:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRPC() {
  try {
    console.log('\n=== Testing populate_sample_data ===')
    const { data: populateData, error: populateError } = await supabase.rpc('populate_sample_data')
    console.log('Populate result:', { data: populateData, error: populateError })

    console.log('\n=== Testing get_trending_artists ===')
    const { data: artists, error: artistsError } = await supabase.rpc('get_trending_artists', { p_limit: 5 })
    console.log('Artists result:', { data: artists, error: artistsError })

    console.log('\n=== Testing get_top_shows ===')
    const { data: shows, error: showsError } = await supabase.rpc('get_top_shows', { p_limit: 5 })
    console.log('Shows result:', { data: shows, error: showsError })

    console.log('\n=== Basic table queries ===')
    const { data: artistCount, error: artistCountError } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true })
    
    const { data: showCount, error: showCountError } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
    
    console.log('Artist count:', { count: artistCount, error: artistCountError })
    console.log('Show count:', { count: showCount, error: showCountError })

  } catch (error) {
    console.error('Test error:', error)
  }
}

testRPC()