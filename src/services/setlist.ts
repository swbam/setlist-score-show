
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";
import { toast } from "sonner";

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
  votes: number;
  position: number;
  song?: Song;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs: SetlistSong[];
}

/**
 * Get or create a setlist for a show
 */
export async function getOrCreateSetlist(showId: string): Promise<string | null> {
  try {
    if (!showId) {
      console.error("No show ID provided to getOrCreateSetlist");
      return null;
    }
    
    console.log("Getting setlist for show:", showId);
    
    // Check if a setlist already exists
    const { data: existingSetlists, error } = await supabase
      .from("setlists")
      .select("id")
      .eq("show_id", showId)
      .limit(1);
      
    if (error) {
      console.error("Error checking for existing setlist:", error);
      throw error;
    }
    
    if (existingSetlists && existingSetlists.length > 0) {
      console.log("Found existing setlist:", existingSetlists[0].id);
      return existingSetlists[0].id;
    }
    
    // Create a new setlist
    console.log("Creating new setlist for show:", showId);
    
    // Get artist ID from the show
    const { data: show, error: showError } = await supabase
      .from("shows")
      .select("artist_id")
      .eq("id", showId)
      .single();
      
    if (showError) {
      console.error("Error getting show details:", showError);
      throw showError;
    }
    
    if (!show) {
      console.error("Show not found:", showId);
      return null;
    }
    
    const artistId = show.artist_id;
    
    if (!artistId) {
      console.error("No artist ID for show:", showId);
      return null;
    }
    
    // Now create the setlist
    const { data: setlist, error: createError } = await supabase
      .from("setlists")
      .insert([{ show_id: showId }])
      .select("id")
      .single();
      
    if (createError) {
      console.error("Error creating setlist:", createError);
      throw createError;
    }
    
    if (!setlist) {
      console.error("Failed to create setlist");
      return null;
    }
    
    console.log("Created new setlist:", setlist.id);
    
    // Get random songs for this artist
    const { data: songsData, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .eq("artist_id", artistId)
      .limit(100); // Get a sample of songs
      
    if (songsError) {
      console.error("Error getting songs for artist:", songsError);
      // Don't fail, we can add songs later
    }
    
    // If we have songs, add 5 random ones to the setlist
    if (songsData && songsData.length > 0) {
      // Shuffle the array and take 5
      const shuffled = [...songsData].sort(() => 0.5 - Math.random());
      const selectedSongs = shuffled.slice(0, 5);
      
      console.log("Adding 5 random songs to setlist");
      
      // Create setlist songs
      const setlistSongs = selectedSongs.map((song, index) => ({
        setlist_id: setlist.id,
        song_id: song.id,
        votes: 0,
        position: index + 1
      }));
      
      const { error: addError } = await supabase
        .from("setlist_songs")
        .insert(setlistSongs);
        
      if (addError) {
        console.error("Error adding songs to setlist:", addError);
        // Don't fail, the setlist is still created
      }
    } else {
      // If no songs in database, try to fetch from Spotify
      try {
        const songs = await spotifyService.getArtistTopTracks(artistId);
        if (songs && songs.length > 0) {
          // Take up to 5 songs
          const selectedSongs = songs.slice(0, 5);
          
          // First, ensure songs are in the database
          for (const song of selectedSongs) {
            const { error: songError } = await supabase
              .from("songs")
              .insert([song])
              .onConflict("id")
              .merge();
              
            if (songError) {
              console.error("Error storing song:", songError);
            }
          }
          
          // Create setlist songs
          const setlistSongs = selectedSongs.map((song, index) => ({
            setlist_id: setlist.id,
            song_id: song.id,
            votes: 0,
            position: index + 1
          }));
          
          const { error: addError } = await supabase
            .from("setlist_songs")
            .insert(setlistSongs);
            
          if (addError) {
            console.error("Error adding songs to setlist:", addError);
          }
        }
      } catch (spotifyError) {
        console.error("Error fetching songs from Spotify:", spotifyError);
      }
    }
    
    return setlist.id;
  } catch (error) {
    console.error("Error in getOrCreateSetlist:", error);
    throw error;
  }
}

/**
 * Get a setlist with its songs
 */
export async function getSetlistWithSongs(setlistId: string): Promise<Setlist | null> {
  try {
    if (!setlistId) {
      console.error("No setlist ID provided");
      return null;
    }
    
    const { data: setlist, error } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", setlistId)
      .single();
      
    if (error) {
      console.error("Error fetching setlist:", error);
      return null;
    }
    
    const { data: songs, error: songsError } = await supabase
      .from("setlist_songs")
      .select(`
        *,
        song:songs(*)
      `)
      .eq("setlist_id", setlistId)
      .order("votes", { ascending: false });
      
    if (songsError) {
      console.error("Error fetching setlist songs:", songsError);
      return null;
    }
    
    return {
      ...setlist,
      songs: songs || []
    };
  } catch (error) {
    console.error("Error in getSetlistWithSongs:", error);
    return null;
  }
}

/**
 * Vote for a song in a setlist
 */
export async function voteForSong(setlistSongId: string): Promise<number | null> {
  try {
    // Call the RPC function to vote
    const { data, error } = await supabase
      .rpc("vote_for_song", { setlist_song_id: setlistSongId });
    
    if (error) {
      console.error("Error voting for song:", error);
      return null;
    }
    
    if (!data || !data.success) {
      console.error("Vote failed:", data?.message || "Unknown error");
      return null;
    }
    
    return data.votes;
  } catch (error) {
    console.error("Error in voteForSong:", error);
    return null;
  }
}

/**
 * Add a song to a setlist
 */
export async function addSongToSetlist(
  setlistId: string,
  songId: string
): Promise<boolean> {
  try {
    // Get current highest position
    const { data: currentSongs, error: posError } = await supabase
      .from("setlist_songs")
      .select("position")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: false })
      .limit(1);
    
    const nextPosition = currentSongs && currentSongs.length > 0
      ? currentSongs[0].position + 1
      : 1;
    
    // Add the song
    const { error } = await supabase
      .from("setlist_songs")
      .insert([{
        setlist_id: setlistId,
        song_id: songId,
        votes: 0,
        position: nextPosition
      }]);
      
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
