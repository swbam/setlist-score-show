
import { supabase } from "@/integrations/supabase/client";

export interface Song {
  id: string;
  artist_id: string;
  name: string;
  album: string;
  duration_ms: number;
  popularity: number;
  spotify_url: string;
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  song?: Song;
  position: number;
  votes: number;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs: SetlistSong[];
}

// Get or create a setlist for a show
export async function getOrCreateSetlist(showId: string): Promise<string> {
  try {
    console.log("Getting or creating setlist for show:", showId);
    
    // Check if setlist already exists
    const { data: existingSetlist, error: checkError } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error checking existing setlist:", checkError);
      throw new Error(checkError.message);
    }
    
    // If setlist exists, return its ID
    if (existingSetlist) {
      console.log("Found existing setlist:", existingSetlist.id);
      return existingSetlist.id;
    }
    
    // Get artist ID for the show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();
    
    if (showError) {
      console.error("Error getting show details:", showError);
      throw new Error(showError.message);
    }
    
    if (!show) {
      console.error("Show not found:", showId);
      throw new Error("Show not found");
    }
    
    const artistId = show.artist_id;
    console.log("Found artist ID for show:", artistId);
    
    // Create new setlist
    const { data: newSetlist, error: createError } = await supabase
      .from('setlists')
      .insert({ show_id: showId })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating setlist:", createError);
      throw new Error(createError.message);
    }
    
    if (!newSetlist) {
      throw new Error("Failed to create setlist");
    }
    
    console.log("Created new setlist:", newSetlist.id);
    
    // Get 5 random songs for the artist
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .limit(50); // Get up to 50 songs to randomly select from
    
    if (songsError) {
      console.error("Error getting artist songs:", songsError);
      // Don't throw here, we'll still return the setlist ID
    }
    
    if (songs && songs.length > 0) {
      console.log(`Found ${songs.length} songs for artist ${artistId}`);
      
      // Shuffle and select 5 random songs (or fewer if there are less than 5)
      const shuffledSongs = shuffleArray(songs);
      const selectedSongs = shuffledSongs.slice(0, Math.min(5, songs.length));
      
      // Add songs to setlist
      for (let i = 0; i < selectedSongs.length; i++) {
        const songId = selectedSongs[i].id;
        console.log(`Adding song ${songId} to setlist at position ${i + 1}`);
        
        const { error: insertError } = await supabase
          .from('setlist_songs')
          .insert({
            setlist_id: newSetlist.id,
            song_id: songId,
            position: i + 1,
            votes: 0
          });
        
        if (insertError) {
          console.error(`Error adding song ${songId} to setlist:`, insertError);
          // Continue with other songs even if one fails
        }
      }
      
      console.log(`Added ${selectedSongs.length} songs to setlist ${newSetlist.id}`);
    } else {
      console.warn(`No songs found for artist ${artistId}`);
    }
    
    return newSetlist.id;
  } catch (error) {
    console.error("Error in getOrCreateSetlist:", error);
    throw error;
  }
}

// Get setlist with songs for a show
export async function getSetlistWithSongs(setlistId: string): Promise<Setlist | null> {
  try {
    // Get the setlist details
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
    
    if (setlistError) {
      console.error("Error getting setlist details:", setlistError);
      return null;
    }
    
    // Get the songs in the setlist
    const { data: setlistSongs, error: songsError } = await supabase
      .from('setlist_songs')
      .select(`
        *,
        song:songs(*)
      `)
      .eq('setlist_id', setlistId)
      .order('votes', { ascending: false });
    
    if (songsError) {
      console.error("Error getting setlist songs:", songsError);
      return null;
    }
    
    // Return the setlist with songs
    return {
      ...setlist,
      songs: setlistSongs as SetlistSong[]
    };
  } catch (error) {
    console.error("Error in getSetlistWithSongs:", error);
    return null;
  }
}

// Get setlist for a show
export async function getSetlistByShowId(showId: string): Promise<Setlist | null> {
  try {
    // First, get or create a setlist for this show
    const setlistId = await getOrCreateSetlist(showId);
    
    // Then, get the setlist with songs
    return getSetlistWithSongs(setlistId);
  } catch (error) {
    console.error("Error in getSetlistByShowId:", error);
    return null;
  }
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Add a song to a setlist
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  try {
    // Get current max position
    const { data: maxPosition, error: maxPositionError } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();
    
    if (maxPositionError && maxPositionError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error("Error getting max position:", maxPositionError);
      return false;
    }
    
    const newPosition = maxPosition ? maxPosition.position + 1 : 1;
    
    // Check if song already exists in setlist
    const { data: existingSong, error: checkError } = await supabase
      .from('setlist_songs')
      .select('id')
      .eq('setlist_id', setlistId)
      .eq('song_id', songId);
    
    if (checkError) {
      console.error("Error checking existing song:", checkError);
      return false;
    }
    
    if (existingSong && existingSong.length > 0) {
      console.warn("Song already exists in setlist");
      return false;
    }
    
    // Add song to setlist
    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: newPosition,
        votes: 0
      });
    
    if (insertError) {
      console.error("Error adding song to setlist:", insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in addSongToSetlist:", error);
    return false;
  }
}

// Vote for a song in a setlist
export async function voteForSong(setlistSongId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .rpc('vote_for_song', { setlist_song_id: setlistSongId });
    
    if (error) {
      console.error("Error voting for song:", error);
      return null;
    }
    
    if (typeof data === 'object' && data !== null) {
      // Handle as object type
      if ('success' in data && !data.success) {
        console.warn("Vote not counted:", data.message);
        return null;
      }
      
      return 'votes' in data ? Number(data.votes) : null;
    }
    
    return null;
  } catch (error) {
    console.error("Error in voteForSong:", error);
    return null;
  }
}

// Get songs for an artist
export async function getArtistSongs(artistId: string): Promise<Song[]> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false });
    
    if (error) {
      console.error("Error getting artist songs:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getArtistSongs:", error);
    return [];
  }
}
