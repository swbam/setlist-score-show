const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ailrmwtahifvstpfhbgn.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA'

const supabase = createClient(supabaseUrl, supabaseKey)

const sampleArtists = [
  {
    name: 'Taylor Swift',
    slug: 'taylor-swift',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb859e4c14fa59296c8649e0e4',
    genres: ['pop', 'country'],
    popularity: 100,
    needs_spotify_sync: false
  },
  {
    name: 'Bad Bunny',
    slug: 'bad-bunny',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb4423e7d3c2b6e8e8e8e8e8e8',
    genres: ['reggaeton', 'latin'],
    popularity: 98,
    needs_spotify_sync: false
  },
  {
    name: 'The Weeknd',
    slug: 'the-weeknd',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    genres: ['r&b', 'pop'],
    popularity: 95,
    needs_spotify_sync: false
  },
  {
    name: 'Billie Eilish',
    slug: 'billie-eilish',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb7ac976bb4a5e7b0b4e9b6e0e',
    genres: ['pop', 'alternative'],
    popularity: 93,
    needs_spotify_sync: false
  },
  {
    name: 'Harry Styles',
    slug: 'harry-styles',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb2e8ed79e177de9a2d8e8e8e8',
    genres: ['pop', 'rock'],
    popularity: 91,
    needs_spotify_sync: false
  }
]

const sampleVenues = [
  {
    name: 'Madison Square Garden',
    city: 'New York',
    state: 'NY',
    country: 'US',
    capacity: 20000,
    address: '4 Pennsylvania Plaza',
    postal_code: '10001',
    latitude: 40.7505,
    longitude: -73.9934
  },
  {
    name: 'Staples Center',
    city: 'Los Angeles',
    state: 'CA',
    country: 'US',
    capacity: 21000,
    address: '1111 S Figueroa St',
    postal_code: '90015',
    latitude: 34.0430,
    longitude: -118.2673
  },
  {
    name: 'United Center',
    city: 'Chicago',
    state: 'IL',
    country: 'US',
    capacity: 23500,
    address: '1901 W Madison St',
    postal_code: '60612',
    latitude: 41.8807,
    longitude: -87.6742
  }
]

const sampleSongs = [
  // Taylor Swift songs
  { title: 'Anti-Hero', album: 'Midnights', duration: 200 },
  { title: 'Shake It Off', album: '1989', duration: 219 },
  { title: 'Love Story', album: 'Fearless', duration: 236 },
  { title: 'Blank Space', album: '1989', duration: 231 },
  { title: 'We Are Never Getting Back Together', album: 'Red', duration: 313 },
  
  // Bad Bunny songs
  { title: 'Tití Me Preguntó', album: 'Un Verano Sin Ti', duration: 247 },
  { title: 'Me Porto Bonito', album: 'Un Verano Sin Ti', duration: 177 },
  { title: 'Ojitos Lindos', album: 'Un Verano Sin Ti', duration: 258 },
  
  // The Weeknd songs
  { title: 'Blinding Lights', album: 'After Hours', duration: 200 },
  { title: 'Can\'t Feel My Face', album: 'Beauty Behind the Madness', duration: 213 },
  { title: 'The Hills', album: 'Beauty Behind the Madness', duration: 242 },
  
  // Billie Eilish songs
  { title: 'bad guy', album: 'When We All Fall Asleep, Where Do We Go?', duration: 194 },
  { title: 'Happier Than Ever', album: 'Happier Than Ever', duration: 298 },
  { title: 'What Was I Made For?', album: 'Barbie The Album', duration: 222 },
  
  // Harry Styles songs
  { title: 'As It Was', album: 'Harry\'s House', duration: 167 },
  { title: 'Watermelon Sugar', album: 'Fine Line', duration: 174 },
  { title: 'Golden', album: 'Fine Line', duration: 206 }
]

async function populateData() {
  console.log('🚀 Starting data population...')
  
  try {
    // 1. Insert artists
    console.log('📝 Inserting artists...')
    const { data: insertedArtists, error: artistsError } = await supabase
      .from('artists')
      .upsert(sampleArtists, { onConflict: 'slug' })
      .select()
    
    if (artistsError) {
      throw new Error(`Artists error: ${artistsError.message}`)
    }
    
    console.log(`✅ Inserted ${insertedArtists.length} artists`)
    
    // 2. Insert venues
    console.log('🏟️ Inserting venues...')
    const { data: insertedVenues, error: venuesError } = await supabase
      .from('venues')
      .upsert(sampleVenues, { onConflict: 'name' })
      .select()
    
    if (venuesError) {
      throw new Error(`Venues error: ${venuesError.message}`)
    }
    
    console.log(`✅ Inserted ${insertedVenues.length} venues`)
    
    // 3. Insert songs for each artist
    console.log('🎵 Inserting songs...')
    const songsToInsert = []
    
    // Taylor Swift songs
    const taylorSwift = insertedArtists.find(a => a.slug === 'taylor-swift')
    if (taylorSwift) {
      songsToInsert.push(
        ...sampleSongs.slice(0, 5).map(song => ({ ...song, artist_id: taylorSwift.id }))
      )
    }
    
    // Bad Bunny songs
    const badBunny = insertedArtists.find(a => a.slug === 'bad-bunny')
    if (badBunny) {
      songsToInsert.push(
        ...sampleSongs.slice(5, 8).map(song => ({ ...song, artist_id: badBunny.id }))
      )
    }
    
    // The Weeknd songs
    const theWeeknd = insertedArtists.find(a => a.slug === 'the-weeknd')
    if (theWeeknd) {
      songsToInsert.push(
        ...sampleSongs.slice(8, 11).map(song => ({ ...song, artist_id: theWeeknd.id }))
      )
    }
    
    // Billie Eilish songs
    const billieEilish = insertedArtists.find(a => a.slug === 'billie-eilish')
    if (billieEilish) {
      songsToInsert.push(
        ...sampleSongs.slice(11, 14).map(song => ({ ...song, artist_id: billieEilish.id }))
      )
    }
    
    // Harry Styles songs
    const harryStyles = insertedArtists.find(a => a.slug === 'harry-styles')
    if (harryStyles) {
      songsToInsert.push(
        ...sampleSongs.slice(14, 17).map(song => ({ ...song, artist_id: harryStyles.id }))
      )
    }
    
    const { data: insertedSongs, error: songsError } = await supabase
      .from('songs')
      .upsert(songsToInsert, { onConflict: 'artist_id,title' })
      .select()
    
    if (songsError) {
      throw new Error(`Songs error: ${songsError.message}`)
    }
    
    console.log(`✅ Inserted ${insertedSongs.length} songs`)
    
    // 4. Create shows (upcoming dates)
    console.log('🎤 Creating shows...')
    const showsToInsert = []
    const today = new Date()
    
    insertedArtists.forEach((artist, index) => {
      insertedVenues.forEach((venue, venueIndex) => {
        if ((index + venueIndex) % 2 === 0) { // Create shows for some artist-venue combinations
          const showDate = new Date(today)
          showDate.setDate(today.getDate() + (index * 10) + (venueIndex * 5) + 7) // Future dates
          
          showsToInsert.push({
            artist_id: artist.id,
            venue_id: venue.id,
            name: `${artist.name} at ${venue.name}`,
            date: showDate.toISOString(),
            status: 'upcoming',
            popularity: Math.floor(Math.random() * 50) + 50,
            min_price: 50 + (Math.random() * 100),
            max_price: 150 + (Math.random() * 200)
          })
        }
      })
    })
    
    const { data: insertedShows, error: showsError } = await supabase
      .from('shows')
      .upsert(showsToInsert, { onConflict: 'artist_id,venue_id,date' })
      .select()
    
    if (showsError) {
      throw new Error(`Shows error: ${showsError.message}`)
    }
    
    console.log(`✅ Created ${insertedShows.length} shows`)
    
    // 5. Create setlists with songs
    console.log('📋 Creating setlists...')
    for (const show of insertedShows) {
      try {
        // Create setlist
        const { data: setlist, error: setlistError } = await supabase
          .from('setlists')
          .insert({ show_id: show.id })
          .select()
          .single()
        
        if (setlistError) {
          console.warn(`Failed to create setlist for show ${show.id}:`, setlistError.message)
          continue
        }
        
        // Get songs for this artist
        const artistSongs = insertedSongs.filter(song => song.artist_id === show.artist_id)
        
        if (artistSongs.length > 0) {
          // Add songs to setlist
          const setlistSongsToInsert = artistSongs.map((song, index) => ({
            setlist_id: setlist.id,
            song_id: song.id,
            position: index + 1,
            vote_count: Math.floor(Math.random() * 50) // Random initial votes
          }))
          
          const { error: setlistSongsError } = await supabase
            .from('setlist_songs')
            .upsert(setlistSongsToInsert, { onConflict: 'setlist_id,song_id' })
          
          if (setlistSongsError) {
            console.warn(`Failed to add songs to setlist ${setlist.id}:`, setlistSongsError.message)
          }
        }
      } catch (error) {
        console.warn(`Error creating setlist for show ${show.id}:`, error.message)
      }
    }
    
    console.log('✅ Created setlists with songs')
    
    // 6. Refresh homepage cache if function exists
    console.log('🔄 Refreshing homepage cache...')
    try {
      await supabase.rpc('refresh_homepage_cache')
      console.log('✅ Homepage cache refreshed')
    } catch (error) {
      console.log('⚠️ Could not refresh homepage cache (function may not exist):', error.message)
    }
    
    console.log('🎉 Data population completed successfully!')
    console.log(`
📊 Summary:
- ${insertedArtists.length} artists
- ${insertedVenues.length} venues  
- ${insertedSongs.length} songs
- ${insertedShows.length} shows
- Setlists created for all shows
`)
    
  } catch (error) {
    console.error('❌ Error populating data:', error.message)
    process.exit(1)
  }
}

// Run the script
populateData() 