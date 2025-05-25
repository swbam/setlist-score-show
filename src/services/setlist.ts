
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as catalogService from "@/services/catalog";

// Define types for better TypeScript support
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
  song?: Song;
}

export interface Setlist {
  id: string;
  show_id: string;
  created_at: string;
  updated_at: string;
  songs?: SetlistSong[];
}

// Get or create setlist for a show
export async function getOrCreateSetlist(showId: string) {
  try {
    console.log("Getting or creating setlist for show:", showId);
    
    // Check if setlist already exists
    const { data: existingSetlist, error: checkError } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing setlist:", checkError);
      return null;
    }
    
    if (existingSetlist) {
      console.log("Existing setlist found:", existingSetlist.id);
      return existingSetlist.id;
    }
    
    console.log("No existing setlist found, creating new one");
    
    // Create new setlist
    const { data: newSetlist, error: createError } = await supabase
      .from('setlists')
      .insert({ show_id: showId })
      .select()
      .single();
      
    if (createError) {
      console.error("Error creating new setlist:", createError);
      return null;
    }
    
    console.log("New setlist created:", newSetlist.id);
    
    // Get artist ID from show
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();
      
    if (showError) {
      console.error("Error getting show details:", showError);
      return newSetlist.id; // Return setlist ID even though we couldn't get the artist
    }
    
    // Create initial setlist songs (random 5 songs from artist catalog)
    await createInitialSetlistSongs(newSetlist.id, show.artist_id);
    
    return newSetlist.id;
  } catch (error) {
    console.error("Error in getOrCreateSetlist:", error);
    return null;
  }
}

// Get setlist with songs
export async function getSetlistWithSongs(setlistId: string): Promise<Setlist | null> {
  try {
    console.log("Getting setlist with songs:", setlistId);
    
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', setlistId)
      .single();
      
    if (setlistError) {
      console.error("Error getting setlist:", setlistError);
      return null;
    }
    
    // Use proper column hints to avoid ambiguous relationships
    const { data: songs, error: songsError } = await supabase
      .from('setlist_songs')
      .select(`
        *,
        songs!setlist_songs_song_id_fkey(*)
      `)
      .eq('setlist_id', setlistId)
      .order('votes', { ascending: false })
      .order('position', { ascending: true });
      
    if (songsError) {
      console.error("Error getting setlist songs:", songsError);
      return setlist;
    }
    
    // Transform the data to match expected format
    const transformedSongs = (songs || []).map(song => ({
      ...song,
      song: song.songs || undefined
    }));
    
    return {
      ...setlist,
      songs: transformedSongs
    };
  } catch (error) {
    console.error("Error in getSetlistWithSongs:", error);
    return null;
  }
}

// Create initial setlist songs (random 5 songs)
async function createInitialSetlistSongs(setlistId: string, artistId: string) {
  try {
    console.log("Creating initial setlist songs for artist:", artistId);
    
    // Use catalog service to get/create random songs for the setlist
    const randomSongs = await catalogService.getRandomSongsForSetlist(artistId, 5);
    
    if (!randomSongs || randomSongs.length === 0) {
      console.error("No songs found for artist:", artistId);
      return;
    }
    
    console.log(`Selected ${randomSongs.length} random songs for initial setlist`);
    
    // Insert into setlist_songs
    const setlistSongs = randomSongs.map((song, index) => ({
      setlist_id: setlistId,
      song_id: song.id,
      position: index + 1,
      votes: 0
    }));
    
    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);
      
    if (insertError) {
      console.error("Error inserting setlist songs:", insertError);
    } else {
      console.log("Successfully inserted initial setlist songs");
    }
  } catch (error) {
    console.error("Error in createInitialSetlistSongs:", error);
  }
}

// Add song to setlist
export async function addSongToSetlist(setlistId: string, songId: string) {
  try {
    console.log("Adding song to setlist:", setlistId, songId);
    
    // Check if song already in setlist
    const { data: existingSong, error: checkError } = await supabase
      .from('setlist_songs')
      .select('id')
      .eq('setlist_id', setlistId)
      .eq('song_id', songId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking for existing song:", checkError);
      return false;
    }
    
    if (existingSong) {
      console.log("Song already in setlist");
      return false;
    }
    
    // Get next position
    const { data: maxPosition, error: positionError } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();
      
    if (positionError && positionError.code !== 'PGRST116') {
      console.error("Error getting max position:", positionError);
      return false;
    }
    
    const nextPosition = maxPosition ? maxPosition.position + 1 : 1;
    
    // Add song to setlist
    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: nextPosition,
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

// Search for songs by artist
export async function searchSongsByArtist(artistId: string, query: string) {
  try {
    // First make sure we have the artist's catalog
    await catalogService.syncArtistCatalog(artistId);
    
    // Then search songs
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .ilike('name', `%${query}%`)
      .order('popularity', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error("Error searching songs by artist:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in searchSongsByArtist:", error);
    return [];
  }
}

// Get popular songs for an artist
export async function getPopularSongsForArtist(artistId: string, limit: number = 10): Promise<Song[]> {
  try {
    console.log(`Getting popular songs for artist: ${artistId}`);
    
    // Check if we have songs for this artist
    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);
      
    // If we don't have any songs, fetch them first
    if (!count || count === 0) {
      console.log("No songs found for artist, fetching from Spotify");
      await fetchArtistSongs(artistId);
    }
    
    // Get popular songs
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error getting popular songs:", error);
      return [];
    }
    
    return songs || [];
  } catch (error) {
    console.error("Error in getPopularSongsForArtist:", error);
    return [];
  }
}

// Search for songs by an artist with a query
export async function searchArtistSongs(artistId: string, query: string): Promise<Song[]> {
  try {
    console.log(`Searching for songs by artist ${artistId} with query: ${query}`);
    
    // Try to search locally first
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);
      
    if (error) {
      console.error("Error searching for songs:", error);
      return [];
    }
    
    // If we have results, return them
    if (songs && songs.length > 0) {
      return songs;
    }
    
    // If no results, try to fetch from Spotify first and then search again
    console.log("No songs found locally, fetching from Spotify first");
    await fetchArtistSongs(artistId);
    
    // Try searching again
    const { data: refreshedSongs, error: refreshError } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);
      
    if (refreshError) {
      console.error("Error searching for songs after refresh:", refreshError);
      return [];
    }
    
    return refreshedSongs || [];
  } catch (error) {
    console.error("Error in searchArtistSongs:", error);
    return [];
  }
}

// Fetch artist songs from Spotify and store them in the database
export async function fetchArtistSongs(artistId: string): Promise<boolean> {
  try {
    console.log("Fetching artist songs from Spotify:", artistId);
    
    // Use the Spotify service to get and store the artist's tracks
    return await spotifyService.importArtistCatalog(artistId);
  } catch (error) {
    console.error("Error in fetchArtistSongs:", error);
    return false;
  }
}
