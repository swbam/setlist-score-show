import { createServerClient } from '@/lib/supabase-server'

interface Song {
  id: string
  title: string
  popularity: number
}

export async function createInitialSetlist(showId: string, artistId: string) {
  const supabase = createServerClient()
  
  try {
    // Get artist's top songs
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, popularity')
      .eq('artist_id', artistId)
      .gte('popularity', 50)
      .order('popularity', { ascending: false })
      .limit(20)
    
    let selectedSongs = songs || []
    
    if (selectedSongs.length < 5) {
      // If not enough popular songs, get any songs
      const { data: moreSongs } = await supabase
        .from('songs')
        .select('id, title, popularity')
        .eq('artist_id', artistId)
        .order('popularity', { ascending: false })
        .limit(20)
      
      selectedSongs = [...selectedSongs, ...(moreSongs || [])]
    }

    // Select varied songs (mix of popular and deep cuts)
    const finalSongs = selectVariedSongs(selectedSongs, 15)

    // Create setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
        name: 'Main Set',
        order_index: 0,
        is_encore: false
      })
      .select('id')
      .single()

    if (setlistError) throw setlistError

    // Create setlist songs
    const setlistSongs = finalSongs.map((song, index) => ({
      setlist_id: setlist.id,
      song_id: song.id,
      position: index + 1,
      vote_count: 0
    }))

    const { error: songsInsertError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs)

    if (songsInsertError) throw songsInsertError

    return setlist
  } catch (error) {
    console.error('Error creating initial setlist:', error)
    throw error
  }
}

function selectVariedSongs(songs: Song[], count: number): Song[] {
  if (songs.length <= count) return songs
  
  const popular = songs.slice(0, Math.ceil(count * 0.6))
  const deepCuts = songs.slice(Math.ceil(count * 0.6))
  
  // Shuffle deep cuts
  const shuffled = deepCuts.sort(() => Math.random() - 0.5)
  
  return [...popular, ...shuffled.slice(0, count - popular.length)]
}

export async function createShowWithSetlist(showData: {
  artist_id: string
  venue_id: string
  date: string
  title?: string
  ticketmaster_id?: string
  ticketmaster_url?: string
}) {
  const supabase = createServerClient()
  
  try {
    // Create the show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .insert(showData)
      .select('id, artist_id')
      .single()

    if (showError) throw showError

    // Create initial setlist
    await createInitialSetlist(show.id, show.artist_id)

    return show
  } catch (error) {
    console.error('Error creating show with setlist:', error)
    throw error
  }
}