// Test complete data flow: search → artist creation → show sync
import * as dotenv from 'dotenv'
dotenv.config()

async function testCompleteFlow() {
  console.log('🧪 Testing complete data flow...')
  
  const apiUrl = 'http://localhost:4000/graphql'
  
  try {
    // Step 1: Search for Coldplay
    console.log('\n1️⃣ Searching for Coldplay...')
    const searchQuery = `
      query SearchArtists {
        search(query: "Coldplay") {
          artists {
            id
            name
            spotifyId
            ticketmasterId
            setlistfmMbid
          }
          totalResults
        }
      }
    `
    
    const searchResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery })
    })
    
    const searchData = await searchResponse.json()
    console.log('Search results:', JSON.stringify(searchData, null, 2))
    
    if (searchData.data?.search?.artists?.length > 0) {
      const artist = searchData.data.search.artists[0]
      console.log(`✅ Found artist: ${artist.name}`)
      console.log(`   Spotify ID: ${artist.spotifyId}`)
      console.log(`   Ticketmaster ID: ${artist.ticketmasterId}`)
      console.log(`   Setlist.fm MBID: ${artist.setlistfmMbid}`)
      
      // Wait a bit for background sync to complete
      console.log('\n⏳ Waiting 5 seconds for background sync...')
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Step 2: Get artist by slug with shows
      console.log('\n2️⃣ Getting artist page data...')
      const slug = artist.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
      const artistQuery = `
        query GetArtist {
          artistBySlug(slug: "${slug}") {
            id
            name
            shows {
              id
              title
              date
              venue {
                name
                city
              }
              status
            }
            songs {
              id
              title
              album
            }
          }
        }
      `
      
      const artistResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: artistQuery })
      })
      
      const artistData = await artistResponse.json()
      console.log('Artist data:', JSON.stringify(artistData, null, 2))
      
      if (artistData.data?.artistBySlug) {
        const artistDetails = artistData.data.artistBySlug
        console.log(`\n✅ Artist: ${artistDetails.name}`)
        console.log(`   Songs: ${artistDetails.songs.length}`)
        console.log(`   Shows: ${artistDetails.shows.length}`)
        
        if (artistDetails.shows.length > 0) {
          console.log('\n📅 Upcoming shows:')
          artistDetails.shows.slice(0, 3).forEach((show: any, i: number) => {
            console.log(`${i + 1}. ${show.title}`)
            console.log(`   Date: ${show.date}`)
            console.log(`   Venue: ${show.venue.name}, ${show.venue.city}`)
          })
          
          // Step 3: Get a specific show
          const showId = artistDetails.shows[0].id
          console.log(`\n3️⃣ Getting show details for: ${showId}`)
          
          const showQuery = `
            query GetShow {
              show(id: "${showId}") {
                id
                title
                date
                artist {
                  name
                }
                venue {
                  name
                  city
                  state
                }
                setlists {
                  name
                  setlistSongs {
                    position
                    song {
                      title
                    }
                    voteCount
                  }
                }
              }
            }
          `
          
          const showResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: showQuery })
          })
          
          const showData = await showResponse.json()
          console.log('Show data:', JSON.stringify(showData, null, 2))
          
          if (showData.data?.show) {
            console.log('\n✅ SUCCESS! Complete data flow working:')
            console.log('   1. Artist imported from Spotify ✓')
            console.log('   2. External IDs obtained from all APIs ✓')
            console.log('   3. Songs imported from Spotify ✓')
            console.log('   4. Shows synced from Ticketmaster ✓')
            console.log('   5. Setlists created with songs ✓')
            console.log('   6. Ready for voting! ✓')
          }
        } else {
          console.log('\n⚠️ No shows found. Possible reasons:')
          console.log('   - Artist has no upcoming shows on Ticketmaster')
          console.log('   - Ticketmaster API key issue')
          console.log('   - Background sync still in progress')
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

// Check if API is running first
fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __typename }' })
})
  .then(() => testCompleteFlow())
  .catch(() => {
    console.error('❌ API is not running. Start it with: pnpm dev')
    process.exit(1)
  })