import { supabase } from "@/integrations/supabase/client";

// Setlist.fm API key
const SETLISTFM_API_KEY = import.meta.env.VITE_SETLISTFM_API_KEY;

// Validate that required environment variable is set
if (!SETLISTFM_API_KEY) {
  console.error("Setlist.fm API key is not configured. Please set VITE_SETLISTFM_API_KEY environment variable.");
}

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
