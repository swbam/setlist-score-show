#!/usr/bin/env node

/**
 * Test script for backend RPC functions and edge functions
 * Tests the enhanced backend implementation for TheSet platform
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testRPCFunctions() {
  console.log('🧪 Testing Backend RPC Functions...\n')

  try {
    // Test 1: Check homepage cache
    console.log('1. Testing refresh_homepage_cache...')
    const { data: cacheResult, error: cacheError } = await supabase.rpc('refresh_homepage_cache')
    if (cacheError) {
      console.error('❌ Error refreshing homepage cache:', cacheError)
    } else {
      console.log('✅ Homepage cache refreshed successfully')
    }

    // Test 2: Get trending artists
    console.log('\n2. Testing get_trending_artists...')
    const { data: trendingArtists, error: artistsError } = await supabase.rpc('get_trending_artists', { p_limit: 5 })
    if (artistsError) {
      console.error('❌ Error getting trending artists:', artistsError)
    } else {
      console.log(`✅ Found ${trendingArtists?.length || 0} trending artists`)
      if (trendingArtists && trendingArtists.length > 0) {
        console.log('   Sample artist:', trendingArtists[0].name)
      }
    }

    // Test 3: Get top shows
    console.log('\n3. Testing get_top_shows...')
    const { data: topShows, error: showsError } = await supabase.rpc('get_top_shows', { p_limit: 5 })
    if (showsError) {
      console.error('❌ Error getting top shows:', showsError)
    } else {
      console.log(`✅ Found ${topShows?.length || 0} top shows`)
      if (topShows && topShows.length > 0) {
        console.log('   Sample show:', topShows[0].title)
      }
    }

    // Test 4: ZIP code lookup
    console.log('\n4. Testing get_nearby_shows with ZIP code...')
    const { data: nearbyShows, error: zipError } = await supabase.rpc('get_nearby_shows', { 
      p_zip_code: '10001',
      p_radius_km: 50 
    })
    if (zipError) {
      console.error('❌ Error getting nearby shows:', zipError)
    } else {
      console.log(`✅ Found ${nearbyShows?.length || 0} shows near ZIP 10001`)
      if (nearbyShows && nearbyShows.length > 0) {
        console.log('   Sample nearby show:', nearbyShows[0].show_name)
      }
    }

    // Test 5: Get location from ZIP
    console.log('\n5. Testing get_location_from_zip...')
    const { data: location, error: locationError } = await supabase.rpc('get_location_from_zip', { p_zip_code: '10001' })
    if (locationError) {
      console.error('❌ Error getting location from ZIP:', locationError)
    } else {
      console.log('✅ Location lookup successful')
      if (location && location.length > 0) {
        console.log(`   NYC coordinates: ${location[0].latitude}, ${location[0].longitude}`)
      }
    }

    // Test 6: Check sync status
    console.log('\n6. Testing get_sync_status...')
    const { data: syncStatus, error: syncError } = await supabase.rpc('get_sync_status')
    if (syncError) {
      console.error('❌ Error getting sync status:', syncError)
    } else {
      console.log(`✅ Retrieved sync status for ${syncStatus?.length || 0} jobs`)
      if (syncStatus && syncStatus.length > 0) {
        console.log('   Latest sync:', syncStatus[0].job_name, syncStatus[0].status)
      }
    }

    // Test 7: Check homepage metrics  
    console.log('\n7. Testing get_homepage_metrics...')
    const { data: metrics, error: metricsError } = await supabase.rpc('get_homepage_metrics')
    if (metricsError) {
      console.error('❌ Error getting homepage metrics:', metricsError)
    } else {
      console.log('✅ Homepage metrics retrieved')
      if (metrics && metrics.length > 0) {
        const m = metrics[0]
        console.log(`   Artists: ${m.total_artists}, Shows: ${m.total_shows}, Venues: ${m.total_venues}`)
        console.log(`   Upcoming shows: ${m.upcoming_shows}, Total votes: ${m.total_votes}`)
      }
    }

    // Test 8: Check homepage cache data
    console.log('\n8. Testing homepage cache data...')
    const { data: cacheData, error: cacheDataError } = await supabase
      .from('homepage_cache')
      .select('cache_key, expires_at')
      .gte('expires_at', new Date().toISOString())
    
    if (cacheDataError) {
      console.error('❌ Error checking cache data:', cacheDataError)
    } else {
      console.log(`✅ Found ${cacheData?.length || 0} active cache entries`)
      if (cacheData && cacheData.length > 0) {
        cacheData.forEach(cache => {
          console.log(`   Cache: ${cache.cache_key} (expires: ${cache.expires_at})`)
        })
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }

  console.log('\n🧪 Backend tests completed!')
}

async function testEdgeFunctions() {
  console.log('\n🌐 Testing Edge Functions...')

  try {
    // Test sync-spotify-enhanced
    console.log('\n1. Testing sync-spotify-enhanced function...')
    const spotifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-spotify-enhanced`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (spotifyResponse.ok) {
      const spotifyResult = await spotifyResponse.json()
      console.log('✅ Spotify sync function responded:', spotifyResult.message || 'Success')
    } else {
      console.log('⚠️ Spotify sync function returned:', spotifyResponse.status)
    }

    // Test sync-top-shows-enhanced  
    console.log('\n2. Testing sync-top-shows-enhanced function...')
    const showsResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-top-shows-enhanced`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (showsResponse.ok) {
      const showsResult = await showsResponse.json()
      console.log('✅ Shows sync function responded:', showsResult.message || 'Success')
      if (showsResult.stats) {
        console.log('   Stats:', JSON.stringify(showsResult.stats, null, 2))
      }
    } else {
      console.log('⚠️ Shows sync function returned:', showsResponse.status)
    }

  } catch (error) {
    console.error('💥 Edge function test failed:', error)
  }

  console.log('\n🌐 Edge function tests completed!')
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting TheSet Backend Implementation Tests\n')
  console.log('================================================\n')

  await testRPCFunctions()
  await testEdgeFunctions()

  console.log('\n================================================')
  console.log('🎉 All tests completed!')
  console.log('\nNext steps:')
  console.log('1. Check Supabase dashboard for any errors')
  console.log('2. Verify cron jobs are scheduled properly')
  console.log('3. Monitor sync job performance')
  console.log('4. Test with frontend integration')
}

runAllTests().catch(console.error)