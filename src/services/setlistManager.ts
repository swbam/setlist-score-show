
import { supabase } from "@/integrations/supabase/client";
import * as catalogService from "@/services/catalog";

/**
 * Enhanced setlist management service
 */

export interface SetlistCreationResult {
  success: boolean;
  setlistId: string | null;
  songsAdded: number;
  error?: string;
}

/**
 * Get or create setlist for a show with 5 random songs
 */
export async function getOrCreateSetlistWithSongs(showId: string): Promise<SetlistCreationResult> {
  try {
    console.log(`[Setlist Manager] Getting/creating setlist for show: ${showId}`);

    // Step 1: Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select(`
        id,
        setlist_songs(id, song_id, position, votes)
      `)
      .eq('show_id', showId)
      .maybeSingle();

    if (existingSetlist) {
      console.log(`[Setlist Manager] Found existing setlist: ${existingSetlist.id} with ${existingSetlist.setlist_songs?.length || 0} songs`);
      return {
        success: true,
        setlistId: existingSetlist.id,
        songsAdded: existingSetlist.setlist_songs?.length || 0
      };
    }

    // Step 2: Get show details to find artist
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('id, artist_id, name')
      .eq('id', showId)
      .single();

    if (showError || !show) {
      console.error(`[Setlist Manager] Show not found: ${showId}`, showError);
      return {
        success: false,
        setlistId: null,
        songsAdded: 0,
        error: 'Show not found'
      };
    }

    console.log(`[Setlist Manager] Show found: ${show.name} by artist ${show.artist_id}`);

    // Step 3: Ensure artist has song catalog
    console.log(`[Setlist Manager] Ensuring artist catalog for: ${show.artist_id}`);
    await catalogService.syncArtistCatalog(show.artist_id);

    // Step 4: Get random songs for setlist
    const randomSongs = await catalogService.getRandomSongsForSetlist(show.artist_id, 5);
    
    if (randomSongs.length === 0) {
      console.warn(`[Setlist Manager] No songs found for artist: ${show.artist_id}`);
      return {
        success: false,
        setlistId: null,
        songsAdded: 0,
        error: 'No songs available for artist'
      };
    }

    console.log(`[Setlist Manager] Found ${randomSongs.length} songs for setlist`);

    // Step 5: Create setlist
    const { data: newSetlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId
      })
      .select('id')
      .single();

    if (setlistError || !newSetlist) {
      console.error(`[Setlist Manager] Error creating setlist:`, setlistError);
      return {
        success: false,
        setlistId: null,
        songsAdded: 0,
        error: setlistError?.message || 'Failed to create setlist'
      };
    }

    console.log(`[Setlist Manager] Created setlist: ${newSetlist.id}`);

    // Step 6: Add songs to setlist
    const setlistSongs = randomSongs.map((song, index) => ({
      setlist_id: newSetlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0
    }));

    const { error: songsError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);

    if (songsError) {
      console.error(`[Setlist Manager] Error adding songs to setlist:`, songsError);
      return {
        success: false,
        setlistId: newSetlist.id,
        songsAdded: 0,
        error: songsError.message
      };
    }

    console.log(`[Setlist Manager] Successfully created setlist ${newSetlist.id} with ${randomSongs.length} songs`);

    return {
      success: true,
      setlistId: newSetlist.id,
      songsAdded: randomSongs.length
    };

  } catch (error) {
    console.error(`[Setlist Manager] Error:`, error);
    return {
      success: false,
      setlistId: null,
      songsAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get full setlist with songs for display
 */
export async function getSetlistWithSongs(showId: string) {
  try {
    console.log(`[Setlist Manager] Getting setlist for show: ${showId}`);

    const { data: setlistData, error } = await supabase
      .from('setlists')
      .select(`
        id,
        show_id,
        created_at,
        updated_at,
        setlist_songs(
          id,
          position,
          votes,
          song_id,
          songs(
            id,
            name,
            album,
            duration_ms,
            popularity,
            spotify_url,
            artist_id
          )
        )
      `)
      .eq('show_id', showId)
      .maybeSingle();

    if (error) {
      console.error(`[Setlist Manager] Error fetching setlist:`, error);
      return null;
    }

    if (!setlistData) {
      console.log(`[Setlist Manager] No setlist found for show: ${showId}`);
      return null;
    }

    // Sort songs by position and then by votes
    const sortedSongs = (setlistData.setlist_songs || [])
      .sort((a, b) => {
        // First sort by votes (descending)
        if (b.votes !== a.votes) {
          return b.votes - a.votes;
        }
        // Then by original position (ascending)
        return a.position - b.position;
      });

    return {
      ...setlistData,
      setlist_songs: sortedSongs
    };

  } catch (error) {
    console.error(`[Setlist Manager] Error:`, error);
    return null;
  }
}

/**
 * Add song to existing setlist
 */
export async function addSongToSetlist(setlistId: string, songId: string): Promise<boolean> {
  try {
    console.log(`[Setlist Manager] Adding song ${songId} to setlist ${setlistId}`);

    // Check if song already exists in setlist
    const { data: existingSong } = await supabase
      .from('setlist_songs')
      .select('id')
      .eq('setlist_id', setlistId)
      .eq('song_id', songId)
      .maybeSingle();

    if (existingSong) {
      console.log(`[Setlist Manager] Song already in setlist`);
      return true;
    }

    // Get next position
    const { data: maxPosition } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPosition?.position || 0) + 1;

    // Add song
    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: nextPosition,
        votes: 0
      });

    if (error) {
      console.error(`[Setlist Manager] Error adding song:`, error);
      return false;
    }

    console.log(`[Setlist Manager] Successfully added song to position ${nextPosition}`);
    return true;

  } catch (error) {
    console.error(`[Setlist Manager] Error:`, error);
    return false;
  }
}
