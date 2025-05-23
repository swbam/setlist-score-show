
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
  songs: SetlistSong[]; // Make sure songs is required, not optional
}

// Get setlist for a show
export async function getSetlistByShowId(showId: string): Promise<Setlist | null> {
  try {
    // First, get or create a setlist for this show
    const { data: setlistData, error: setlistError } = await supabase
      .rpc('get_or_create_setlist', { show_id: showId })
      .single();
    
    if (setlistError) {
      console.error("Error getting or creating setlist:", setlistError);
      return null;
    }
    
    const setlistId = setlistData;
    
    // Then, get the setlist details with songs
    const { data: setlist, error: setlistDetailsError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
    
    if (setlistDetailsError) {
      console.error("Error getting setlist details:", setlistDetailsError);
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
    
    // If no songs in setlist yet, create initial setlist with 5 random songs
    if (setlistSongs.length === 0) {
      // Get the artist_id for the show
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select('artist_id')
        .eq('id', showId)
        .single();
      
      if (showError) {
        console.error("Error getting show:", showError);
        return null;
      }
      
      // Get 5 random songs from the artist
      const { data: randomSongs, error: randomSongsError } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', show.artist_id)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (randomSongsError) {
        console.error("Error getting random songs:", randomSongsError);
        return null;
      }
      
      // If we have enough songs, pick 5 random ones
      if (randomSongs.length >= 5) {
        const selectedSongs = shuffleArray(randomSongs).slice(0, 5);
        
        // Add songs to setlist
        for (let i = 0; i < selectedSongs.length; i++) {
          const { error: addError } = await supabase
            .from('setlist_songs')
            .insert({
              setlist_id: setlistId,
              song_id: selectedSongs[i].id,
              position: i + 1,
              votes: 0
            });
          
          if (addError) {
            console.error("Error adding song to setlist:", addError);
          }
        }
        
        // Get updated setlist songs
        const { data: updatedSetlistSongs, error: updatedSongsError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            song:songs(*)
          `)
          .eq('setlist_id', setlistId)
          .order('votes', { ascending: false });
        
        if (updatedSongsError) {
          console.error("Error getting updated setlist songs:", updatedSongsError);
          return null;
        }
        
        // Return the updated setlist with songs
        return {
          ...setlist,
          songs: updatedSetlistSongs as SetlistSong[]
        };
      }
    }
    
    // Return the setlist with songs
    return {
      ...setlist,
      songs: setlistSongs as SetlistSong[]
    };
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
    
    if (!data.success) {
      console.warn("Vote not counted:", data.message);
      return null;
    }
    
    return data.votes;
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
