// Direct test of Ticketmaster API
require('dotenv').config()
const axios = require('axios')

async function testTicketmaster() {
  const apiKey = process.env.TICKETMASTER_API_KEY
  
  if (!apiKey) {
    console.error('❌ TICKETMASTER_API_KEY not found in environment')
    return
  }
  
  console.log('🧪 Testing Ticketmaster API directly...')
  console.log(`API Key: ${apiKey.substring(0, 8)}...`)
  
  try {
    // Search for Coldplay
    console.log('\n1️⃣ Searching for Coldplay artists...')
    const searchUrl = `https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=Coldplay&apikey=${apiKey}`
    const searchResponse = await axios.get(searchUrl)
    
    if (searchResponse.data._embedded?.attractions) {
      const attractions = searchResponse.data._embedded.attractions
      console.log(`✅ Found ${attractions.length} attractions`)
      
      const coldplay = attractions.find(a => a.name === 'Coldplay') || attractions[0]
      if (coldplay) {
        console.log(`\n✅ Found: ${coldplay.name}`)
        console.log(`   ID: ${coldplay.id}`)
        console.log(`   Type: ${coldplay.type}`)
        
        // Get events for Coldplay
        console.log('\n2️⃣ Getting Coldplay events...')
        const eventsUrl = `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${coldplay.id}&size=10&apikey=${apiKey}`
        const eventsResponse = await axios.get(eventsUrl)
        
        if (eventsResponse.data._embedded?.events) {
          const events = eventsResponse.data._embedded.events
          console.log(`✅ Found ${events.length} events`)
          
          console.log('\n📅 First 3 events:')
          events.slice(0, 3).forEach((event, i) => {
            console.log(`\n${i + 1}. ${event.name}`)
            console.log(`   ID: ${event.id}`)
            console.log(`   Date: ${event.dates.start.localDate}`)
            console.log(`   Time: ${event.dates.start.localTime || 'TBD'}`)
            if (event._embedded?.venues?.[0]) {
              const venue = event._embedded.venues[0]
              console.log(`   Venue: ${venue.name}`)
              console.log(`   City: ${venue.city.name}, ${venue.state?.name || venue.country.name}`)
            }
          })
        } else {
          console.log('❌ No events found')
        }
      }
    } else {
      console.log('❌ No attractions found')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

testTicketmaster()