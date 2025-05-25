import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";

export interface SetlistCreationResult {
  setlist_id: string;
  songs_added: number;
  success: boolean;
  message?: string;
}

// Get or create a setlist for a show with 5 initial random songs
export async function getOrCreateSetlistWithSongs(showId: string): Promise<SetlistCreationResult> {
  try {
    console.log(`Getting or creating setlist for show: ${showId}`);

    // First check if setlist already exists
    const { data: existingSetlist, error: setlistError } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (existingSetlist) {
      // Count existing songs
      const { count } = await supabase
        .from('setlist_songs')
        .select('id', { count: 'exact' })
        .eq('setlist_id', existingSetlist.id);

      console.log(`Existing setlist found with ${count || 0} songs`);
      return {
        setlist_id: existingSetlist.id,
        songs_added: count || 0,
        success: true,
        message: 'Existing setlist found'
      };
    }

    // Get show details to find the artist
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();

    if (showError || !show) {
      console.error('Show not found:', showError);
      return {
        setlist_id: '',
        songs_added: 0,
        success: false,
        message: 'Show not found'
      };
    }

    // Check if artist has songs in database
    const { count: songCount } = await supabase
      .from('songs')
      .select('id', { count: 'exact' })
      .eq('artist_id', show.artist_id);

    // If no songs exist, import from Spotify first
    if (!songCount || songCount === 0) {
      console.log(`No songs found for artist ${show.artist_id}, importing from Spotify...`);
      const imported = await spotifyService.importArtistCatalog(show.artist_id);
      
      if (!imported) {
        console.warn(`Failed to import songs for artist ${show.artist_id}`);
        return {
          setlist_id: '',
          songs_added: 0,
          success: false,
          message: 'Failed to import artist songs'
        };
      }
    }

    // Use the database function to create setlist with 5 random songs
    const { data: result, error: createError } = await supabase.rpc(
      'create_setlist_with_songs',
      { p_show_id: showId }
    );

    if (createError) {
      console.error('Error creating setlist:', createError);
      return {
        setlist_id: '',
        songs_added: 0,
        success: false,
        message: createError.message
      };
    }

    if (result && result.length > 0) {
      const firstResult = result[0] as any;
      console.log(`Successfully created setlist with ${firstResult.songs_added} songs`);
      return {
        setlist_id: firstResult.setlist_id,
        songs_added: firstResult.songs_added,
        success: true,
        message: `Created setlist with ${firstResult.songs_added} songs`
      };
    }

    return {
      setlist_id: '',
      songs_added: 0,
      success: false,
      message: 'Unknown error occurred'
    };

  } catch (error) {
    console.error('Error in getOrCreateSetlistWithSongs:', error);
    return {
      setlist_id: '',
      songs_added: 0,
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export alias for backwards compatibility
export const ensureSetlistExists = async (showId: string): Promise<string | null> => {
  const result = await getOrCreateSetlistWithSongs(showId);
  return result.success ? result.setlist_id : null;
};

// Add a song to an existing setlist
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  try {
    // Get the next position
    const { count } = await supabase
      .from('setlist_songs')
      .select('id', { count: 'exact' })
      .eq('setlist_id', setlistId);

    const position = (count || 0) + 1;

    // Add the song
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: position,
        votes: 0
      });

    if (error) {
      console.error('Error adding song to setlist:', error);
      return false;
    }

    console.log(`Successfully added song ${songId} to setlist ${setlistId}`);
    return true;
  } catch (error) {
    console.error('Error in addSongToSetlist:', error);
    return false;
  }
}

// Remove a song from a setlist
export async function removeSongFromSetlist(setlistSongId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('setlist_songs')
      .delete()
      .eq('id', setlistSongId);

    if (error) {
      console.error('Error removing song from setlist:', error);
      return false;
    }

    console.log(`Successfully removed song ${setlistSongId} from setlist`);
    return true;
  } catch (error) {
    console.error('Error in removeSongFromSetlist:', error);
    return false;
  }
}
