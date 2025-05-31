import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const SETLISTFM_API_KEY = import.meta.env.VITE_SETLISTFM_API_KEY || 'xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL';
const SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

interface SetlistFmResponse {
  id: string;
  artist: { name: string };
  venue: { name: string; city: { name: string } };
  eventDate: string;
  sets: { set: Array<{ song: Array<{ name: string }> }> };
}

export async function searchSetlists(artistName: string, date: Date) {
  const eventDate = format(date, 'dd-MM-yyyy');
  
  const response = await fetch(
    `${SETLISTFM_BASE_URL}/search/setlists?` +
    `artistName=${encodeURIComponent(artistName)}&` +
    `date=${eventDate}`,
    {
      headers: {
        'Accept': 'application/json',
        'x-api-key': SETLISTFM_API_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch setlist');
  }

  const data = await response.json();
  return data.setlist?.[0] as SetlistFmResponse;
}

export async function importPlayedSetlist(showId: string) {
  // Get show details
  const { data: show, error: showError } = await supabase
    .from('shows')
    .select(`
      *,
      artist:artists(*)
    `)
    .eq('id', showId)
    .single();

  if (showError || !show) {
    throw new Error('Show not found');
  }

  // Format date for setlist.fm API
  const eventDate = format(new Date(show.date), 'dd-MM-yyyy');

  // Query setlist.fm
  const response = await fetch(
    `https://api.setlist.fm/rest/1.0/search/setlists?` +
    `artistName=${encodeURIComponent(show.artist.name)}&` +
    `date=${eventDate}`,
    {
      headers: {
        'Accept': 'application/json',
        'x-api-key': process.env.SETLISTFM_API_KEY
      }
    }
  );

  const data: SetlistFmResponse = await response.json();

  // Create played setlist record
  const { data: playedSetlist } = await supabase
    .from('played_setlists')
    .insert({
      show_id: showId,
      setlist_fm_id: data.id,
      played_date: new Date(show.date),
      imported_at: new Date()
    })
    .select()
    .single();

  // Process and insert songs
  const allSongs = data.sets.set.flatMap(set =>
    set.song.map(song => song.name)
  );

  for (let i = 0; i < allSongs.length; i++) {
    const songId = await matchOrCreateSong(show.artist_id, allSongs[i]);
    
    await supabase
      .from('played_setlist_songs')
      .insert({
        played_setlist_id: playedSetlist.id,
        song_id: songId,
        position: i + 1
      });
  }
}

async function matchOrCreateSong(artistId: string, songName: string): Promise<string> {
  // Try to find existing song
  const { data: existingSong } = await supabase
    .from('songs')
    .select('id')
    .eq('artist_id', artistId)
    .ilike('name', songName)
    .single();

  if (existingSong) {
    return existingSong.id;
  }

  // Create new song
  const { data: newSong } = await supabase
    .from('songs')
    .insert({
      artist_id: artistId,
      name: songName,
      album: 'Unknown',
      duration_ms: 0,
      popularity: 0,
      spotify_url: ''
    })
    .select('id')
    .single();

  return newSong.id;
}


