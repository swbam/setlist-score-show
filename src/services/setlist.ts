import { supabase } from "@/integrations/supabase/client";
import { getRandomSongsForSetlist } from "@/services/catalog";

export interface Song {
  id: string;
  artist_id: string;
  name: string;
  album: string;
  duration_ms: number;
  popularity: number;
  spotify_url: string;
}

// Base interface without song property to avoid circular reference
export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  votes: number;
}

// Extended interface with joined song data
export interface SetlistSongWithData extends SetlistSong {
  song?: Song;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs: SetlistSongWithData[];
}

// Get or create a setlist for a show
export async function getOrCreateSetlist(showId: string): Promise<string> {
  try {
    // Call the Supabase function to get or create a setlist
    const { data, error } = await supabase.rpc('get_or_create_setlist', {
      show_id: showId
    });
    
    if (error) {
      console.error("Error creating setlist:", error);
      throw error;
    }
    
    console.log("Created or retrieved setlist with ID:", data);
    return data;
  } catch (error) {
    console.error("Error in getOrCreateSetlist:", error);
    throw error;
  }
}

// Get setlist with songs for a show
export async function getSetlistWithSongs(setlistId: string): Promise<Setlist | null> {
  try {
    // Get the basic setlist data
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
    
    if (setlistError || !setlist) {
      console.error("Error fetching setlist:", setlistError);
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
      console.error("Error fetching setlist songs:", songsError);
      return null;
    }
    
    // Return the combined data
    return {
      ...setlist,
      songs: setlistSongs || []
    };
  } catch (error) {
    console.error("Error in getSetlistWithSongs:", error);
    return null;
  }
}

// Get setlist for a show
export async function getSetlistByShowId(showId: string): Promise<Setlist | null> {
  try {
    // Find the setlist for this show
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('show_id', showId)
      .maybeSingle();
    
    if (setlistError || !setlist) {
      console.error("No setlist found for show:", showId);
      return null;
    }
    
    // Get the songs in the setlist
    return getSetlistWithSongs(setlist.id);
  } catch (error) {
    console.error("Error in getSetlistByShowId:", error);
    return null;
  }
}

// Create a new setlist for a show
export async function createSetlistForShow(showId: string): Promise<string | null> {
  try {
    console.log(`Creating setlist for show: ${showId}`);
    
    // Get show details to find artist
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();
    
    if (showError || !show) {
      console.error(`Error fetching show ${showId}:`, showError);
      return null;
    }
    
    const artistId = show.artist_id;
    
    // Create setlist record 
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId,
      })
      .select()
      .single();
    
    if (setlistError || !setlist) {
      console.error("Error creating setlist:", setlistError);
      return null;
    }
    
    // Get 5 random songs from artist's catalog
    const randomSongs = await getRandomSongsForSetlist(artistId, 5);
    
    if (!randomSongs || randomSongs.length === 0) {
      console.error("Failed to get random songs for setlist");
      return setlist.id;
    }
    
    console.log(`Adding ${randomSongs.length} initial songs to setlist`);
    
    // Add songs to setlist with initial votes of 0
    const setlistSongs = randomSongs.map((song, index) => ({
      setlist_id: setlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0
    }));
    
    const { error: songsError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);
    
    if (songsError) {
      console.error("Error adding songs to setlist:", songsError);
    }
    
    return setlist.id;
  } catch (error) {
    console.error("Error creating setlist:", error);
    return null;
  }
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Add a song to a setlist
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  try {
    // Get the current highest position
    const { data: existingSongs, error: countError } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1);
    
    // Determine the next position (either 1 if no songs, or highest + 1)
    const nextPosition = existingSongs && existingSongs.length > 0
      ? existingSongs[0].position + 1
      : 1;
    
    // Add the song to the setlist
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: nextPosition,
        votes: 0
      });
    
    if (error) {
      console.error("Error adding song to setlist:", error);
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
    // Call the vote function
    const { data, error } = await supabase.rpc('vote_for_song', {
      setlist_song_id: setlistSongId
    });
    
    if (error) {
      console.error("Error voting for song:", error);
      return null;
    }
    
    // Handle the response properly with type checking
    if (data && typeof data === 'object' && 'success' in data && 'votes' in data) {
      return data.votes as number;
    } else {
      console.error("Vote failed:", data && typeof data === 'object' && 'message' in data ? data.message : "Unknown error");
      return null;
    }
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
      console.error("Error fetching artist songs:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getArtistSongs:", error);
    return [];
  }
}

// Get voting statistics for a setlist
export async function getSetlistVotingStats(setlistId: string) {
  try {
    // Get total votes
    const { data: totalVotesResult, error: totalVotesError } = await supabase
      .from('setlist_songs')
      .select('votes')
      .eq('setlist_id', setlistId);
    
    if (totalVotesError) {
      console.error("Error getting total votes:", totalVotesError);
      return null;
    }
    
    const totalVotes = totalVotesResult.reduce((sum, song) => sum + song.votes, 0);
    
    // Get unique voters
    const { count: uniqueVoters, error: uniqueVotersError } = await supabase
      .from('votes')
      .select('user_id', { count: 'exact', head: true })
      .eq('setlist_song_id', setlistId);
    
    if (uniqueVotersError) {
      console.error("Error getting unique voters:", uniqueVotersError);
      return null;
    }
    
    return {
      totalVotes,
      uniqueVoters: uniqueVoters || 0
    };
  } catch (error) {
    console.error("Error in getSetlistVotingStats:", error);
    return null;
  }
}
