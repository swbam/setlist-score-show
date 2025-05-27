
import { supabase } from "@/integrations/supabase/client";

export interface SetlistCreationResult {
  success: boolean;
  message: string;
  setlist_id?: string;
  songs_added?: number;
}

/**
 * Get or create setlist with initial songs for a show
 * This is the main function used throughout the app
 */
export async function getOrCreateSetlistWithSongs(showId: string): Promise<SetlistCreationResult> {
  try {
    console.log(`🎵 Getting or creating setlist for show: ${showId}`);

    // Check if setlist already exists
    const { data: existingSetlist, error: checkError } = await supabase
      .from('setlists')
      .select(`
        id,
        setlist_songs(id, song_id, votes)
      `)
      .eq('show_id', showId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("❌ Error checking existing setlist:", checkError);
      return {
        success: false,
        message: `Database error: ${checkError.message}`
      };
    }

    if (existingSetlist) {
      const songCount = (existingSetlist.setlist_songs as any[])?.length || 0;
      console.log(`✅ Found existing setlist with ${songCount} songs`);
      
      return {
        success: true,
        message: `Found existing setlist with ${songCount} songs`,
        setlist_id: existingSetlist.id,
        songs_added: songCount
      };
    }

    // Use the database function to create setlist with songs
    console.log("🔧 Using database function to create setlist...");
    
    const { data: result, error: functionError } = await supabase
      .rpc('create_setlist_with_songs', { p_show_id: showId });

    if (functionError) {
      console.error("❌ Database function error:", functionError);
      return {
        success: false,
        message: `Failed to create setlist: ${functionError.message}`
      };
    }

    if (!result || result.length === 0) {
      return {
        success: false,
        message: "No result returned from setlist creation"
      };
    }

    const { setlist_id, songs_added } = result[0];
    
    console.log(`✅ Successfully created setlist ${setlist_id} with ${songs_added} songs`);
    
    return {
      success: true,
      message: `Created setlist with ${songs_added} songs`,
      setlist_id,
      songs_added
    };

  } catch (error) {
    console.error("❌ Error in getOrCreateSetlistWithSongs:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Add a song to an existing setlist
 */
export async function addSongToSetlist(setlistId: string, songId: string): Promise<SetlistCreationResult> {
  try {
    console.log(`➕ Adding song ${songId} to setlist ${setlistId}`);

    // Check if song is already in setlist
    const { data: existingSong } = await supabase
      .from('setlist_songs')
      .select('id')
      .eq('setlist_id', setlistId)
      .eq('song_id', songId)
      .single();

    if (existingSong) {
      return {
        success: false,
        message: "Song is already in this setlist"
      };
    }

    // Get current highest position
    const { data: maxPosition } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxPosition?.position || 0) + 1;

    // Add the song
    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: nextPosition,
        votes: 0
      });

    if (insertError) {
      console.error("❌ Error adding song to setlist:", insertError);
      return {
        success: false,
        message: `Failed to add song: ${insertError.message}`
      };
    }

    console.log(`✅ Successfully added song to setlist at position ${nextPosition}`);
    
    return {
      success: true,
      message: "Song added to setlist",
      setlist_id: setlistId,
      songs_added: 1
    };

  } catch (error) {
    console.error("❌ Error in addSongToSetlist:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get setlist with songs for a show
 */
export async function getSetlistForShow(showId: string) {
  try {
    const { data: setlist, error } = await supabase
      .from('setlists')
      .select(`
        id,
        show_id,
        created_at,
        updated_at,
        setlist_songs(
          id,
          song_id,
          position,
          votes,
          songs!setlist_songs_song_id_fkey(
            id,
            name,
            album,
            artist_id,
            spotify_url
          )
        )
      `)
      .eq('show_id', showId)
      .single();

    if (error) {
      console.error("❌ Error getting setlist for show:", error);
      return null;
    }

    return setlist;
  } catch (error) {
    console.error("❌ Error in getSetlistForShow:", error);
    return null;
  }
}
