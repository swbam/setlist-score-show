// Test sample data population
const { createServerComponentClient } = require('@supabase/auth-helpers-nextjs')
const { cookies } = require('next/headers')

// Use environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  try {
    console.log('Testing populate_sample_data...')
    const result = await supabase.rpc('populate_sample_data')
    console.log('Populate result:', result)

    console.log('\nTesting get_trending_artists...')
    const artists = await supabase.rpc('get_trending_artists', { p_limit: 5 })
    console.log('Artists result:', artists)

    console.log('\nTesting get_top_shows...')
    const shows = await supabase.rpc('get_top_shows', { p_limit: 5 })
    console.log('Shows result:', shows)

  } catch (error) {
    console.error('Error:', error)
  }
}

test()