const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk1NDQ2MSwiZXhwIjoyMDYzNTMwNDYxfQ.HxuJ0ND0_EF3EMSxMZgqUjiRJwQ86X2e5KBmMOYz3lA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestData() {
  console.log('Creating test data...')
  
  try {
    // Check if we have any shows
    const { data: existingShows, error: showError } = await supabase
      .from('shows')
      .select('count')
      .limit(1)
    
    if (showError) {
      console.error('Error checking shows:', showError)
      return
    }
    
    // Create a test artist if needed
    const { data: artists } = await supabase
      .from('artists')
      .select('*')
      .limit(1)
    
    let artistId
    if (!artists || artists.length === 0) {
      console.log('Creating test artist...')
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: 'Taylor Swift',
          slug: 'taylor-swift',
          image_url: 'https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676',
          genres: ['pop', 'country'],
          popularity: 100,
          followers: 95000000,
          spotify_id: '06HL4z0CvFAxyc27GXpf02',
          ticketmaster_id: 'K8vZ9171o40'
        })
        .select()
        .single()
      
      if (artistError) {
        console.error('Error creating artist:', artistError)
        return
      }
      
      artistId = artist.id
      console.log('Created artist:', artist.name)
    } else {
      artistId = artists[0].id
    }
    
    // Create a test venue
    const { data: venues } = await supabase
      .from('venues')
      .select('*')
      .limit(1)
    
    let venueId
    if (!venues || venues.length === 0) {
      console.log('Creating test venue...')
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: 'Madison Square Garden',
          city: 'New York',
          state: 'NY',
          country: 'US',
          capacity: 20000,
          ticketmaster_id: 'KovZpZA6AAIA'
        })
        .select()
        .single()
      
      if (venueError) {
        console.error('Error creating venue:', venueError)
        return
      }
      
      venueId = venue.id
      console.log('Created venue:', venue.name)
    } else {
      venueId = venues[0].id
    }
    
    // Create test shows
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .eq('artist_id', artistId)
      .limit(1)
    
    if (!shows || shows.length === 0) {
      console.log('Creating test shows...')
      const showDates = [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      ]
      
      for (const date of showDates) {
        const { data: show, error: showError } = await supabase
          .from('shows')
          .insert({
            artist_id: artistId,
            venue_id: venueId,
            date: date.toISOString(),
            title: `Taylor Swift at Madison Square Garden`,
            status: 'upcoming',
            view_count: Math.floor(Math.random() * 1000) + 100
          })
          .select()
          .single()
        
        if (showError) {
          console.error('Error creating show:', showError)
          continue
        }
        
        console.log('Created show for:', date.toDateString())
        
        // Create setlist
        const { data: setlist, error: setlistError } = await supabase
          .from('setlists')
          .insert({
            show_id: show.id,
            name: 'Main Set',
            order_index: 0
          })
          .select()
          .single()
        
        if (setlistError) {
          console.error('Error creating setlist:', setlistError)
          continue
        }
        
        // Create songs if needed
        const { data: songs } = await supabase
          .from('songs')
          .select('*')
          .eq('artist_id', artistId)
          .limit(20)
        
        if (!songs || songs.length === 0) {
          console.log('Creating test songs...')
          const songTitles = [
            'Anti-Hero', 'Blank Space', 'Shake It Off', 'Love Story', 'You Belong With Me',
            'We Are Never Getting Back Together', 'Style', 'Wildest Dreams', 'Bad Blood', 'Delicate',
            'Look What You Made Me Do', 'ME!', 'Lover', 'cardigan', 'willow',
            'All Too Well', 'Enchanted', 'Begin Again', 'Red', 'Paper Rings'
          ]
          
          const createdSongs = []
          for (let i = 0; i < songTitles.length; i++) {
            const { data: song, error: songError } = await supabase
              .from('songs')
              .insert({
                artist_id: artistId,
                title: songTitles[i],
                album: 'Greatest Hits',
                duration_ms: 200000 + Math.floor(Math.random() * 60000),
                popularity: 80 + Math.floor(Math.random() * 20)
              })
              .select()
              .single()
            
            if (!songError) {
              createdSongs.push(song)
            }
          }
          
          // Add songs to setlist
          for (let i = 0; i < Math.min(15, createdSongs.length); i++) {
            await supabase
              .from('setlist_songs')
              .insert({
                setlist_id: setlist.id,
                song_id: createdSongs[i].id,
                position: i + 1,
                vote_count: Math.floor(Math.random() * 50)
              })
          }
        } else {
          // Add existing songs to setlist
          for (let i = 0; i < Math.min(15, songs.length); i++) {
            await supabase
              .from('setlist_songs')
              .insert({
                setlist_id: setlist.id,
                song_id: songs[i].id,
                position: i + 1,
                vote_count: Math.floor(Math.random() * 50)
              })
          }
        }
      }
    }
    
    console.log('Test data created successfully!')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestData()