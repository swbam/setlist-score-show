
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";

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
  position: number;
  votes: number;
  song: Song;
  userVoted?: boolean;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs?: SetlistSong[];
}

// Get or create a setlist for a show
export async function getOrCreateSetlist(showId: string): Promise<Setlist | null> {
  try {
    console.log("Getting or creating setlist for show:", showId);
    
    // First, check if a setlist already exists
    const { data: existingSetlists, error: fetchError } = await supabase
      .from('setlists')
      .select('*')
      .eq('show_id', showId)
      .limit(1);
    
    if (fetchError) {
      console.error("Error fetching existing setlists:", fetchError);
      return null;
    }
    
    // If a setlist exists, return it
    if (existingSetlists && existingSetlists.length > 0) {
      console.log("Existing setlist found:", existingSetlists[0].id);
      return existingSetlists[0] as Setlist;
    }
    
    // No setlist exists, create a new one
    console.log("No setlist found, creating a new one");
    const { data: setlistData, error } = await supabase
      .rpc('get_or_create_setlist', { show_id: showId });
    
    if (error || !setlistData) {
      console.error("Failed to create setlist:", error);
      return null;
    }
    
    const setlistId = setlistData as string;
    console.log("New setlist created with ID:", setlistId);
    
    // Now populate the setlist with 5 random songs
    await populateSetlistWithRandomSongs(setlistId, showId);
    
    // Fetch the newly created setlist
    const { data: newSetlist, error: newSetlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
    
    if (newSetlistError) {
      console.error("Error fetching new setlist:", newSetlistError);
      return null;
    }
    
    return newSetlist as Setlist;
  } catch (error) {
    console.error("Error getting or creating setlist:", error);
    return null;
  }
}

// Populate setlist with 5 random songs
async function populateSetlistWithRandomSongs(setlistId: string, showId: string): Promise<boolean> {
  try {
    console.log("Populating setlist with random songs. Setlist ID:", setlistId);
    
    // Get the show's artist
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();
    
    if (showError || !show) {
      console.error("Error fetching show:", showError);
      return false;
    }
    
    const artistId = show.artist_id;
    console.log("Artist ID for show:", artistId);
    
    // Get artist's songs from the database
    const { data: artistSongs, error: songsError } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId);
    
    if (songsError) {
      console.error("Error fetching artist songs:", songsError);
      return false;
    }
    
    // If the artist has no songs in the database, import catalog from Spotify
    if (!artistSongs || artistSongs.length === 0) {
      console.log("No songs found for artist in database, importing from Spotify");
      
      // Import the full catalog instead of just top tracks
      const success = await spotifyService.importArtistCatalog(artistId);
      
      if (!success) {
        console.error("Could not import artist catalog from Spotify");
        
        // Fallback to top tracks if full catalog import fails
        const tracks = await spotifyService.getArtistTopTracks(artistId);
        if (!tracks || tracks.length === 0) {
          console.error("Could not fetch artist tracks from Spotify");
          return false;
        }
        
        console.log(`Fetched ${tracks.length} top tracks from Spotify, storing in database`);
        await spotifyService.storeTracksInDatabase(artistId, tracks);
      }
      
      // Fetch the newly added songs
      const { data: newArtistSongs, error: newSongsError } = await supabase
        .from('songs')
        .select('*')
        .eq('artist_id', artistId);
        
      if (newSongsError) {
        console.error("Error fetching newly added songs:", newSongsError);
        return false;
      }
        
      if (newArtistSongs && newArtistSongs.length > 0) {
        console.log(`Successfully imported ${newArtistSongs.length} tracks, adding random songs to setlist`);
        // Use the newly fetched songs
        return await addRandomSongsToSetlist(setlistId, newArtistSongs as Song[]);
      } else {
        console.error("Failed to store or retrieve artist songs");
        return false;
      }
    } else {
      console.log(`Found ${artistSongs.length} songs in database for artist, adding random songs to setlist`);
      // Use existing songs in the database
      return await addRandomSongsToSetlist(setlistId, artistSongs as Song[]);
    }
  } catch (error) {
    console.error("Error populating setlist with songs:", error);
    return false;
  }
}

// Add 5 random songs to the setlist
async function addRandomSongsToSetlist(setlistId: string, songs: Song[]): Promise<boolean> {
  try {
    // Randomly select 5 songs (or all if less than 5)
    const selectedSongs = songs.sort(() => 0.5 - Math.random()).slice(0, 5);
    console.log(`Selected ${selectedSongs.length} random songs for setlist`);
    
    // Prepare setlist songs for insertion
    const setlistSongsToInsert = selectedSongs.map((song, index) => ({
      setlist_id: setlistId,
      song_id: song.id,
      position: index + 1, // 1-based position
      votes: 0
    }));
    
    // Insert the setlist songs
    const { error } = await supabase
      .from('setlist_songs')
      .insert(setlistSongsToInsert);
    
    if (error) {
      console.error("Error inserting setlist songs:", error);
      return false;
    }
    
    console.log("Successfully added random songs to setlist");
    return true;
  } catch (error) {
    console.error("Error adding random songs to setlist:", error);
    return false;
  }
}

// Get setlist with songs
export async function getSetlistWithSongs(setlistId: string): Promise<Setlist | null> {
  try {
    console.log("Fetching setlist with songs. Setlist ID:", setlistId);
    
    // Get the setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
    
    if (setlistError || !setlist) {
      console.error("Error fetching setlist:", setlistError);
      return null;
    }
    
    // Get the setlist songs
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
      return setlist as Setlist;
    }
    
    console.log(`Fetched setlist with ${setlistSongs?.length || 0} songs`);
    
    // Include songs with the setlist
    return {
      ...setlist,
      songs: setlistSongs as SetlistSong[]
    };
  } catch (error) {
    console.error("Error getting setlist with songs:", error);
    return null;
  }
}

// Vote for a song
export async function voteForSong(setlistSongId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .rpc('vote_for_song', { setlist_song_id: setlistSongId });
    
    if (error) {
      console.error("Error voting for song:", error);
      return null;
    }
    
    // Parse the JSON response properly to extract success and votes fields
    if (typeof data === 'object' && data !== null) {
      const responseData = data as { success: boolean; votes?: number; message?: string };
      
      if (responseData.success && responseData.votes !== undefined) {
        console.log(`Voted for song, new vote count: ${responseData.votes}`);
        return responseData.votes;
      } else {
        console.error("Vote failed:", responseData.message || "Unknown error");
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error voting for song:", error);
    return null;
  }
}

// Add a song to the setlist
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  try {
    // Get the current highest position
    const { data: highestPosition, error: positionError } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();
    
    if (positionError && positionError.code !== 'PGRST116') { // Not found is ok
      console.error("Error getting highest position:", positionError);
      return false;
    }
    
    const position = highestPosition ? highestPosition.position + 1 : 1;
    console.log(`Adding song to setlist at position ${position}`);
    
    // Insert the new setlist song
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: position,
        votes: 0
      });
    
    if (error) {
      console.error("Error adding song to setlist:", error);
      return false;
    }
    
    console.log("Song added to setlist successfully");
    return true;
  } catch (error) {
    console.error("Error adding song to setlist:", error);
    return false;
  }
}
