
import { supabase } from "@/integrations/supabase/client";
import { importArtistCatalog } from "@/services/spotify";

export interface SetlistCreationResult {
  success: boolean;
  message: string;
  setlistId?: string;
  songsAdded?: number;
}

/**
 * Create a setlist for a show with 5 random songs from the artist's catalog
 */
export const createSetlistForShow = async (showId: string): Promise<SetlistCreationResult> => {
  try {
    console.log(`Creating setlist for show ${showId}`);

    // Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();

    if (existingSetlist) {
      return {
        success: true,
        message: 'Setlist already exists',
        setlistId: existingSetlist.id
      };
    }

    // Get show and artist information
    const { data: show } = await supabase
      .from('shows')
      .select(`
        id,
        artist_id,
        artist:artists(id, name)
      `)
      .eq('id', showId)
      .single();

    if (!show) {
      return {
        success: false,
        message: 'Show not found'
      };
    }

    // Ensure artist has song catalog
    await importArtistCatalog(show.artist_id);

    // Get random songs from artist's catalog
    const { data: artistSongs } = await supabase
      .from('songs')
      .select('id, name, popularity')
      .eq('artist_id', show.artist_id)
      .order('popularity', { ascending: false })
      .limit(50); // Get top 50 songs to choose from

    if (!artistSongs || artistSongs.length === 0) {
      return {
        success: false,
        message: 'No songs found for artist'
      };
    }

    // Select 5 random songs (with bias towards popular songs)
    const selectedSongs = selectRandomSongs(artistSongs, 5);

    // Create setlist
    const { data: newSetlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId
      })
      .select('id')
      .single();

    if (setlistError || !newSetlist) {
      console.error('Error creating setlist:', setlistError);
      return {
        success: false,
        message: 'Failed to create setlist'
      };
    }

    // Add songs to setlist
    const setlistSongs = selectedSongs.map((song, index) => ({
      setlist_id: newSetlist.id,
      song_id: song.id,
      position: index + 1,
      votes: 0
    }));

    const { error: songsError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongs);

    if (songsError) {
      console.error('Error adding songs to setlist:', songsError);
      return {
        success: false,
        message: 'Failed to add songs to setlist'
      };
    }

    console.log(`Created setlist with ${selectedSongs.length} songs for show ${showId}`);

    return {
      success: true,
      message: `Setlist created with ${selectedSongs.length} songs`,
      setlistId: newSetlist.id,
      songsAdded: selectedSongs.length
    };

  } catch (error) {
    console.error('Error creating setlist for show:', error);
    return {
      success: false,
      message: 'Failed to create setlist'
    };
  }
};

/**
 * Select random songs with bias towards more popular songs
 */
function selectRandomSongs(songs: any[], count: number) {
  if (songs.length <= count) {
    return songs;
  }

  // Create weighted array based on popularity
  const weightedSongs = songs.flatMap(song => {
    const weight = Math.max(1, Math.floor(song.popularity / 20)); // Higher popularity = more weight
    return Array(weight).fill(song);
  });

  const selected = new Set();
  const result = [];

  while (result.length < count && selected.size < songs.length) {
    const randomIndex = Math.floor(Math.random() * weightedSongs.length);
    const song = weightedSongs[randomIndex];
    
    if (!selected.has(song.id)) {
      selected.add(song.id);
      result.push(song);
    }
  }

  return result;
}

/**
 * Ensure setlist exists for a show, create if needed
 */
export const ensureSetlistExists = async (showId: string): Promise<string | null> => {
  try {
    // Check if setlist exists
    const { data: setlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();

    if (setlist) {
      return setlist.id;
    }

    // Create setlist if it doesn't exist
    const result = await createSetlistForShow(showId);
    return result.success ? result.setlistId || null : null;

  } catch (error) {
    console.error('Error ensuring setlist exists:', error);
    return null;
  }
};
