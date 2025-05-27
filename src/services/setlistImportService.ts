import { supabase } from "@/integrations/supabase/client";
import { 
  searchSetlists, 
  flattenSetlistSongs, 
  storePlayedSetlist, 
  storePlayedSetlistSongs, 
  matchSongToDatabase,
  SetlistFmSetlist 
} from "./setlistfm";

export interface SetlistImportResult {
  success: boolean;
  playedSetlistId?: string;
  matchedSongs: number;
  totalSongs: number;
  errors: string[];
}

export interface SetlistComparisonData {
  showId: string;
  predictedSongs: Array<{
    id: string;
    name: string;
    votes: number;
    position: number;
  }>;
  actualSongs: Array<{
    id: string;
    name: string;
    position: number;
    matched: boolean;
  }>;
  accuracy: {
    exactMatches: number;
    totalPredicted: number;
    totalActual: number;
    accuracyPercentage: number;
  };
}

// Import setlist from setlist.fm for a specific show
export async function importSetlistForShow(
  showId: string,
  artistName: string,
  showDate: string
): Promise<SetlistImportResult> {
  const result: SetlistImportResult = {
    success: false,
    matchedSongs: 0,
    totalSongs: 0,
    errors: []
  };

  try {
    // Get artist ID for the show
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select(`
        artist_id,
        artists!inner(name)
      `)
      .eq('id', showId)
      .single();

    if (showError || !showData) {
      result.errors.push('Show not found');
      return result;
    }

    // Format date for setlist.fm (DD-MM-YYYY)
    const date = new Date(showDate);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;

    // Search for setlists on setlist.fm
    const setlists = await searchSetlists(artistName, formattedDate);
    
    if (setlists.length === 0) {
      result.errors.push('No setlist found on setlist.fm for this date');
      return result;
    }

    // Use the first setlist found (most relevant)
    const setlist = setlists[0];
    const songs = flattenSetlistSongs(setlist);
    result.totalSongs = songs.length;

    if (songs.length === 0) {
      result.errors.push('Setlist found but contains no songs');
      return result;
    }

    // Store the played setlist
    const playedSetlistId = await storePlayedSetlist(
      showId,
      setlist.id,
      setlist.eventDate
    );

    if (!playedSetlistId) {
      result.errors.push('Failed to store played setlist');
      return result;
    }

    result.playedSetlistId = playedSetlistId;

    // Match and store each song
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const songId = await matchSongToDatabase(showData.artist_id, song.name);
      
      if (songId) {
        const stored = await storePlayedSetlistSongs(
          playedSetlistId,
          songId,
          i + 1
        );
        
        if (stored) {
          result.matchedSongs++;
        } else {
          result.errors.push(`Failed to store song: ${song.name}`);
        }
      } else {
        result.errors.push(`Could not match song: ${song.name}`);
      }
    }

    result.success = result.matchedSongs > 0;
    return result;

  } catch (error) {
    console.error('Error importing setlist:', error);
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

// Get setlist comparison data for a show
export async function getSetlistComparison(showId: string): Promise<SetlistComparisonData | null> {
  try {
    // Get predicted songs (from voting)
    const { data: predictedData, error: predictedError } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        votes,
        position,
        songs!setlist_songs_song_id_fkey(id, name),
        setlists!setlist_songs_setlist_id_fkey(show_id)
      `)
      .eq('setlists.show_id', showId)
      .order('votes', { ascending: false });

    if (predictedError) {
      console.error('Error fetching predicted songs:', predictedError);
      return null;
    }

    // Get actual played songs
    const { data: actualData, error: actualError } = await supabase
      .from('played_setlist_songs')
      .select(`
        position,
        songs!played_setlist_songs_song_id_fkey(id, name),
        played_setlists!played_setlist_songs_played_setlist_id_fkey(show_id)
      `)
      .eq('played_setlists.show_id', showId)
      .order('position');

    if (actualError) {
      console.error('Error fetching actual songs:', actualError);
      return null;
    }

    const predictedSongs = predictedData?.map(item => ({
      id: item.songs.id,
      name: item.songs.name,
      votes: item.votes,
      position: item.position
    })) || [];

    const actualSongs = actualData?.map(item => ({
      id: item.songs.id,
      name: item.songs.name,
      position: item.position,
      matched: false
    })) || [];

    // Calculate matches
    const predictedSongIds = new Set(predictedSongs.map(s => s.id));
    let exactMatches = 0;

    actualSongs.forEach(actualSong => {
      if (predictedSongIds.has(actualSong.id)) {
        actualSong.matched = true;
        exactMatches++;
      }
    });

    const accuracyPercentage = predictedSongs.length > 0 
      ? Math.round((exactMatches / predictedSongs.length) * 100)
      : 0;

    return {
      showId,
      predictedSongs,
      actualSongs,
      accuracy: {
        exactMatches,
        totalPredicted: predictedSongs.length,
        totalActual: actualSongs.length,
        accuracyPercentage
      }
    };

  } catch (error) {
    console.error('Error getting setlist comparison:', error);
    return null;
  }
}

// Check if a show has an imported setlist
export async function hasImportedSetlist(showId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('show_id', showId)
      .limit(1);

    if (error) {
      console.error('Error checking for imported setlist:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking for imported setlist:', error);
    return false;
  }
}

// Auto-import setlists for shows that have passed
export async function autoImportPastShowSetlists(): Promise<void> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get shows from yesterday that don't have imported setlists
    const { data: shows, error } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artists!shows_artist_id_fkey(name)
      `)
      .lt('date', yesterday.toISOString())
      .not('id', 'in', `(
        SELECT show_id FROM played_setlists
      )`);

    if (error) {
      console.error('Error fetching past shows:', error);
      return;
    }

    // Import setlists for each show
    for (const show of shows || []) {
      console.log(`Importing setlist for ${show.artists.name} on ${show.date}`);
      
      const result = await importSetlistForShow(
        show.id,
        show.artists.name,
        show.date
      );

      if (result.success) {
        console.log(`Successfully imported ${result.matchedSongs}/${result.totalSongs} songs`);
      } else {
        console.log(`Failed to import setlist: ${result.errors.join(', ')}`);
      }

      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('Error in auto-import:', error);
  }
}