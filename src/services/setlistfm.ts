
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

// Setlist.fm API key
const SETLISTFM_API_KEY = "xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL";

// Types for Setlist.fm API responses
export interface SetlistFmSong {
  name: string;
}

export interface SetlistFmSet {
  song: SetlistFmSong[];
}

export interface SetlistFmSetlist {
  id: string;
  eventDate: string; // Format: "DD-MM-YYYY"
  lastUpdated: string;
  artist: {
    mbid: string; // MusicBrainz ID
    name: string;
    url: string;
  };
  venue: {
    id: string;
    name: string;
    city: {
      name: string;
      state?: string;
      country: {
        name: string;
      };
    };
  };
  sets: {
    set: SetlistFmSet[];
  };
  url: string;
}

export interface SetlistFmSearchResponse {
  setlist: SetlistFmSetlist[];
  total: number;
  page: number;
  itemsPerPage: number;
}

// Search for setlists by artist name and date
export async function searchSetlists(
  artistName: string, 
  date?: string
): Promise<SetlistFmSetlist[]> {
  try {
    let url = `https://api.setlist.fm/rest/1.0/search/setlists?artistName=${encodeURIComponent(artistName)}`;
    
    if (date) {
      // Convert date to DD-MM-YYYY format if needed
      url += `&date=${date}`;
    }
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "x-api-key": SETLISTFM_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search setlists: ${response.status}`);
    }
    
    const data = await response.json() as SetlistFmSearchResponse;
    return data.setlist || [];
  } catch (error) {
    console.error("Error searching setlists:", error);
    return [];
  }
}

// Flatten setlist songs from multiple sets into a single array
export function flattenSetlistSongs(setlist: SetlistFmSetlist): SetlistFmSong[] {
  try {
    if (!setlist.sets || !setlist.sets.set) {
      return [];
    }
    
    const songs: SetlistFmSong[] = [];
    setlist.sets.set.forEach(set => {
      if (set.song) {
        songs.push(...set.song);
      }
    });
    
    return songs;
  } catch (error) {
    console.error("Error flattening setlist songs:", error);
    return [];
  }
}

// Match or create a song in the database
async function matchOrCreateSong(artistId: string, songName: string): Promise<string | null> {
  try {
    // First, try to find an exact match
    const { data: exactMatch } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .ilike('name', songName)
      .limit(1)
      .single();

    if (exactMatch) {
      return exactMatch.id;
    }

    // Try fuzzy matching using similarity
    const { data: fuzzyMatches } = await supabase
      .rpc('match_song_similarity', {
        p_artist_id: artistId,
        p_song_name: songName,
        p_similarity_threshold: 0.7
      });

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      return fuzzyMatches[0].id;
    }

    // If no match found, create a new song entry
    const songId = crypto.randomUUID();
    const { data: newSong, error } = await supabase
      .from('songs')
      .insert({
        id: songId,
        artist_id: artistId,
        name: songName,
        album: 'Unknown',
        duration_ms: 0,
        popularity: 0,
        spotify_url: ''
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating new song:', error);
      return null;
    }

    return newSong.id;
  } catch (error) {
    console.error('Error matching/creating song:', error);
    return null;
  }
}

// Import a played setlist from setlist.fm
export async function importPlayedSetlist(showId: string): Promise<boolean> {
  try {
    // Get show details with artist information
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        *,
        artist:artists!artist_id(*)
      `)
      .eq('id', showId)
      .single();

    if (showError || !show || !show.artist) {
      console.error('Error fetching show or artist details:', showError);
      return false;
    }

    // Format date for setlist.fm API (DD-MM-YYYY)
    const eventDate = format(new Date(show.date), 'dd-MM-yyyy');

    // Search for setlists on setlist.fm
    const setlists = await searchSetlists(show.artist.name, eventDate);

    if (setlists.length === 0) {
      console.log('No setlists found for this show');
      return false;
    }

    // Use the first (most relevant) setlist found
    const setlist = setlists[0];
    const songs = flattenSetlistSongs(setlist);

    if (songs.length === 0) {
      console.log('No songs found in setlist');
      return false;
    }

    // Check if this setlist has already been imported
    const { data: existingSetlist } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('show_id', showId)
      .eq('setlist_fm_id', setlist.id)
      .single();

    if (existingSetlist) {
      console.log('This setlist has already been imported');
      return true;
    }

    // Create the played setlist record
    const { data: playedSetlist, error: setlistError } = await supabase
      .from('played_setlists')
      .insert({
        show_id: showId,
        setlist_fm_id: setlist.id,
        played_date: new Date(show.date),
        imported_at: new Date()
      })
      .select()
      .single();

    if (setlistError || !playedSetlist) {
      console.error('Error creating played setlist:', setlistError);
      return false;
    }

    // Process and insert songs
    for (let i = 0; i < songs.length; i++) {
      const songId = await matchOrCreateSong(show.artist.id, songs[i].name);
      
      if (songId) {
        await supabase
          .from('played_setlist_songs')
          .insert({
            played_setlist_id: playedSetlist.id,
            song_id: songId,
            position: i + 1
          });
      }
    }

    console.log(`Successfully imported setlist with ${songs.length} songs`);
    return true;
  } catch (error) {
    console.error('Error importing played setlist:', error);
    return false;
  }
}

// Get played setlist for a show
export async function getPlayedSetlistForShow(showId: string) {
  try {
    const { data, error } = await supabase
      .from('played_setlists')
      .select(`
        *,
        played_setlist_songs(
          position,
          song:songs(*)
        )
      `)
      .eq('show_id', showId)
      .order('imported_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching played setlist:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting played setlist:', error);
    return null;
  }
}

// Store played setlist in database
export async function storePlayedSetlist(
  showId: string, 
  setlistFmId: string, 
  playedDate: string
): Promise<string | null> {
  try {
    // Convert DD-MM-YYYY to a proper date format
    const dateParts = playedDate.split('-');
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    const { data, error } = await supabase
      .from('played_setlists')
      .upsert({
        show_id: showId,
        setlist_fm_id: setlistFmId,
        played_date: formattedDate
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error storing played setlist:", error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error("Error storing played setlist:", error);
    return null;
  }
}

// Store played setlist songs in database
export async function storePlayedSetlistSongs(
  playedSetlistId: string,
  songId: string,
  position: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('played_setlist_songs')
      .insert({
        played_setlist_id: playedSetlistId,
        song_id: songId,
        position: position
      });
      
    if (error) {
      console.error("Error storing played setlist song:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing played setlist song:", error);
    return false;
  }
}

// Match song name to database using similarity function
export async function matchSongToDatabase(
  artistId: string, 
  songName: string
): Promise<string | null> {
  try {
    // First try exact match
    const { data: exactMatches } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .ilike('name', songName)
      .limit(1);
    
    if (exactMatches && exactMatches.length > 0) {
      return exactMatches[0].id;
    }
    
    // Try fuzzy matching
    const { data: fuzzyMatches } = await supabase
      .rpc('match_song_similarity', {
        p_artist_id: artistId,
        p_song_name: songName,
        p_similarity_threshold: 0.7
      });
    
    if (fuzzyMatches && fuzzyMatches.length > 0) {
      return fuzzyMatches[0].id;
    }
    
    // No match found
    return null;
  } catch (error) {
    console.error("Error matching song to database:", error);
    return null;
  }
}


