import { supabase } from './supabase'

export async function createTestData() {
  try {
    console.log('Creating test data...')

    // Insert test artists
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .upsert([
        {
          id: 'a1111111-1111-1111-1111-111111111111',
          name: 'The Beatles',
          slug: 'the-beatles',
          spotify_id: '3WrFJ7ztbogyGnTHbHJFl2',
          genres: ['rock', 'pop'],
          popularity: 90,
          followers: 25000000,
          image_url: 'https://i.scdn.co/image/ab6761610000e5ebebdd6e0dd6bd6af239aea8c5'
        },
        {
          id: 'a2222222-2222-2222-2222-222222222222',
          name: 'Pink Floyd',
          slug: 'pink-floyd',
          spotify_id: '0k17h0D3J5VfsdmQ1iZtE9',
          genres: ['rock', 'progressive rock'],
          popularity: 85,
          followers: 15000000,
          image_url: 'https://i.scdn.co/image/ab6761610000e5eb33e7b8b6c5d8f32c3aa513a4'
        }
      ], { onConflict: 'id' })

    if (artistsError) throw artistsError
    console.log('✓ Artists created')

    // Insert test venues
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .upsert([
        {
          id: 'b1111111-1111-1111-1111-111111111111',
          name: 'Madison Square Garden',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          capacity: 20000
        },
        {
          id: 'b2222222-2222-2222-2222-222222222222',
          name: 'The Hollywood Bowl',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          capacity: 17500
        }
      ], { onConflict: 'id' })

    if (venuesError) throw venuesError
    console.log('✓ Venues created')

    // Calculate future dates
    const futureDate1 = new Date()
    futureDate1.setDate(futureDate1.getDate() + 30)
    
    const futureDate2 = new Date()
    futureDate2.setDate(futureDate2.getDate() + 45)

    // Insert test shows
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .upsert([
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          artist_id: 'a1111111-1111-1111-1111-111111111111',
          venue_id: 'b1111111-1111-1111-1111-111111111111',
          date: futureDate1.toISOString().split('T')[0],
          title: 'The Beatles Revival Tour',
          status: 'upcoming'
        },
        {
          id: 'c2222222-2222-2222-2222-222222222222',
          artist_id: 'a2222222-2222-2222-2222-222222222222',
          venue_id: 'b2222222-2222-2222-2222-222222222222',
          date: futureDate2.toISOString().split('T')[0],
          title: 'Pink Floyd Experience',
          status: 'upcoming'
        }
      ], { onConflict: 'id' })

    if (showsError) throw showsError
    console.log('✓ Shows created')

    // Insert test songs
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .upsert([
        {
          id: 'd1111111-1111-1111-1111-111111111111',
          artist_id: 'a1111111-1111-1111-1111-111111111111',
          title: 'Hey Jude',
          album: 'The Beatles (White Album)',
          spotify_id: '0aym2LBJBk9DAYuHHutrIl',
          duration_ms: 431333,
          popularity: 85
        },
        {
          id: 'd2222222-2222-2222-2222-222222222222',
          artist_id: 'a1111111-1111-1111-1111-111111111111',
          title: 'Let It Be',
          album: 'Let It Be',
          spotify_id: '7iN1s7xHE4ifF5povM6A48',
          duration_ms: 243026,
          popularity: 82
        },
        {
          id: 'd3333333-3333-3333-3333-333333333333',
          artist_id: 'a2222222-2222-2222-2222-222222222222',
          title: 'Comfortably Numb',
          album: 'The Wall',
          spotify_id: '5HNCy40Ni5BZJFw1TKzRsC',
          duration_ms: 382296,
          popularity: 88
        },
        {
          id: 'd4444444-4444-4444-4444-444444444444',
          artist_id: 'a2222222-2222-2222-2222-222222222222',
          title: 'Wish You Were Here',
          album: 'Wish You Were Here',
          spotify_id: '6mFkJmJqdDVQ1REhVfGgd1',
          duration_ms: 334743,
          popularity: 86
        }
      ], { onConflict: 'id' })

    if (songsError) throw songsError
    console.log('✓ Songs created')

    // Insert test setlists
    const { data: setlists, error: setlistsError } = await supabase
      .from('setlists')
      .upsert([
        {
          id: 'e1111111-1111-1111-1111-111111111111',
          show_id: 'c1111111-1111-1111-1111-111111111111',
          name: 'Main Set',
          order_index: 0
        },
        {
          id: 'e2222222-2222-2222-2222-222222222222',
          show_id: 'c2222222-2222-2222-2222-222222222222',
          name: 'Main Set',
          order_index: 0
        }
      ], { onConflict: 'id' })

    if (setlistsError) throw setlistsError
    console.log('✓ Setlists created')

    // Insert test setlist songs
    const { data: setlistSongs, error: setlistSongsError } = await supabase
      .from('setlist_songs')
      .upsert([
        {
          setlist_id: 'e1111111-1111-1111-1111-111111111111',
          song_id: 'd1111111-1111-1111-1111-111111111111',
          position: 1,
          vote_count: 0
        },
        {
          setlist_id: 'e1111111-1111-1111-1111-111111111111',
          song_id: 'd2222222-2222-2222-2222-222222222222',
          position: 2,
          vote_count: 0
        },
        {
          setlist_id: 'e2222222-2222-2222-2222-222222222222',
          song_id: 'd3333333-3333-3333-3333-333333333333',
          position: 1,
          vote_count: 0
        },
        {
          setlist_id: 'e2222222-2222-2222-2222-222222222222',
          song_id: 'd4444444-4444-4444-4444-444444444444',
          position: 2,
          vote_count: 0
        }
      ], { onConflict: 'setlist_id,position' })

    if (setlistSongsError) throw setlistSongsError
    console.log('✓ Setlist songs created')

    console.log('🎉 Test data created successfully!')
    return true

  } catch (error) {
    console.error('❌ Error creating test data:', error)
    return false
  }
}