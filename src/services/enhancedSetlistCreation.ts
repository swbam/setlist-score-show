
import { supabase } from '@/integrations/supabase/client';
import { SongCatalogManager } from './songCatalogManager';

interface SetlistCreationResult {
  setlistId: string;
  songsAdded: number;
  catalogImported: boolean;
}

export async function createSetlistWithSongs(
  showId: string,
  onProgress?: (progress: any) => void
): Promise<SetlistCreationResult | null> {
  try {
    // Check if setlist already exists
    const { data: existingSetlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (existingSetlist) {
      // Count existing songs
      const { count } = await supabase
        .from('setlist_songs')
        .select('*', { count: 'exact', head: true })
        .eq('setlist_id', existingSetlist.id);

      return {
        setlistId: existingSetlist.id,
        songsAdded: count || 0,
        catalogImported: false
      };
    }

    // Get show details
    const { data: show } = await supabase
      .from('shows')
      .select(`
        id,
        artist_id,
        artists!shows_artist_id_fkey(id, name)
      `)
      .eq('id', showId)
      .single();

    if (!show || !show.artist_id) {
      throw new Error('Show or artist not found');
    }

    // Check if artist has songs in catalog
    const catalogManager = new SongCatalogManager(onProgress);
    const songCount = await catalogManager.getArtistSongCount(show.artist_id);

    let catalogImported = false;

    // If no songs, import catalog
    if (songCount === 0) {
      onProgress?.({
        status: 'importing',
        message: 'No songs found. Importing artist catalog...'
      });

      catalogImported = await catalogManager.importArtistCatalog(show.artist_id);
      
      if (!catalogImported) {
        throw new Error('Failed to import artist catalog');
      }
    }

    // Create setlist
    const { data: setlist, error: setlistError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId
      })
      .select()
      .single();

    if (setlistError || !setlist) {
      throw new Error('Failed to create setlist');
    }

    // Get 5 random songs for initial seeding
    const randomSongs = await catalogManager.getRandomSongs(show.artist_id, 5);

    if (randomSongs.length === 0) {
      throw new Error('No songs available for setlist');
    }

    // Insert songs into setlist
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
      throw new Error('Failed to add songs to setlist');
    }

    return {
      setlistId: setlist.id,
      songsAdded: randomSongs.length,
      catalogImported
    };

  } catch (error) {
    console.error('Error creating setlist with songs:', error);
    return null;
  }
}

export async function addSongToSetlist(
  setlistId: string,
  songId: string
): Promise<boolean> {
  try {
    // Get current max position
    const { data: maxPosition } = await supabase
      .from('setlist_songs')
      .select('position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newPosition = (maxPosition?.position || 0) + 1;

    const { error } = await supabase
      .from('setlist_songs')
      .insert({
        setlist_id: setlistId,
        song_id: songId,
        position: newPosition,
        votes: 0
      });

    return !error;
  } catch (error) {
    console.error('Error adding song to setlist:', error);
    return false;
  }
}
