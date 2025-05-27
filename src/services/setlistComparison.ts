import { supabase } from '@/integrations/supabase/client';
import { searchSetlists, flattenSetlistSongs, matchSongToDatabase, storePlayedSetlist, storePlayedSetlistSongs } from './setlistfm';

export interface ComparisonResult {
  showId: string;
  predictedSongs: PredictedSong[];
  actualSongs: ActualSong[];
  matches: SongMatch[];
  accuracyScore: number;
  totalPredicted: number;
  totalActual: number;
  correctPredictions: number;
}

export interface PredictedSong {
  id: string;
  name: string;
  votes: number;
  position: number;
  matched: boolean;
  matchedActualPosition?: number;
}

export interface ActualSong {
  name: string;
  position: number;
  matched: boolean;
  matchedPredictedId?: string;
}

export interface SongMatch {
  predictedSongId: string;
  predictedName: string;
  actualName: string;
  predictedPosition: number;
  actualPosition: number;
  positionDiff: number;
}

// Import actual setlist from setlist.fm and compare with predictions
export async function importAndCompareSetlist(showId: string): Promise<ComparisonResult | null> {
  try {
    // Get show details
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        *,
        artists!shows_artist_id_fkey(id, name),
        venues!shows_venue_id_fkey(name, city, state, country)
      `)
      .eq('id', showId)
      .single();

    if (showError || !show) {
      console.error('Error fetching show:', showError);
      return null;
    }

    // Format date for setlist.fm (DD-MM-YYYY)
    const showDate = new Date(show.date);
    const formattedDate = `${showDate.getDate().toString().padStart(2, '0')}-${(showDate.getMonth() + 1).toString().padStart(2, '0')}-${showDate.getFullYear()}`;

    // Search for setlists on setlist.fm
    const setlists = await searchSetlists(show.artists.name, formattedDate);
    
    if (setlists.length === 0) {
      console.log('No setlists found for this show');
      return null;
    }

    // Use the first matching setlist (most relevant)
    const actualSetlist = setlists[0];
    const actualSongs = flattenSetlistSongs(actualSetlist);

    // Store the played setlist in database
    const playedSetlistId = await storePlayedSetlist(showId, actualSetlist.id, formattedDate);
    
    if (!playedSetlistId) {
      console.error('Failed to store played setlist');
      return null;
    }

    // Get predicted setlist from database
    const { data: setlistData } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (!setlistData) {
      console.error('No predicted setlist found for show');
      return null;
    }

    const { data: predictedSongs } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        votes,
        position,
        songs!setlist_songs_song_id_fkey(id, name, artist_id)
      `)
      .eq('setlist_id', setlistData.id)
      .order('votes', { ascending: false });

    if (!predictedSongs) {
      console.error('No predicted songs found');
      return null;
    }

    // Match actual songs to database and store them
    const actualSongsWithMatches: ActualSong[] = [];
    const matches: SongMatch[] = [];
    
    for (let i = 0; i < actualSongs.length; i++) {
      const actualSong = actualSongs[i];
      const position = i + 1;
      
      // Try to match this song to our database
      const matchedSongId = await matchSongToDatabase(show.artist_id, actualSong.name);
      
      if (matchedSongId && playedSetlistId) {
        // Store the played song
        await storePlayedSetlistSongs(playedSetlistId, matchedSongId, position);
      }

      // Check if this song was predicted
      const predictedMatch = predictedSongs.find(ps => 
        ps.songs.id === matchedSongId || 
        ps.songs.name.toLowerCase().trim() === actualSong.name.toLowerCase().trim()
      );

      actualSongsWithMatches.push({
        name: actualSong.name,
        position,
        matched: !!predictedMatch,
        matchedPredictedId: predictedMatch?.id
      });

      // If we found a match, record it
      if (predictedMatch) {
        matches.push({
          predictedSongId: predictedMatch.id,
          predictedName: predictedMatch.songs.name,
          actualName: actualSong.name,
          predictedPosition: predictedSongs.findIndex(ps => ps.id === predictedMatch.id) + 1,
          actualPosition: position,
          positionDiff: Math.abs((predictedSongs.findIndex(ps => ps.id === predictedMatch.id) + 1) - position)
        });
      }
    }

    // Create predicted songs array with match info
    const predictedSongsWithMatches: PredictedSong[] = predictedSongs.map((ps, index) => {
      const match = matches.find(m => m.predictedSongId === ps.id);
      return {
        id: ps.id,
        name: ps.songs.name,
        votes: ps.votes,
        position: index + 1,
        matched: !!match,
        matchedActualPosition: match?.actualPosition
      };
    });

    // Calculate accuracy score
    const correctPredictions = matches.length;
    const totalPredicted = predictedSongs.length;
    const totalActual = actualSongs.length;
    
    // Weighted accuracy: (correct predictions / max(predicted, actual)) * 100
    const accuracyScore = totalPredicted > 0 ? 
      (correctPredictions / Math.max(totalPredicted, totalActual)) * 100 : 0;

    return {
      showId,
      predictedSongs: predictedSongsWithMatches,
      actualSongs: actualSongsWithMatches,
      matches,
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      totalPredicted,
      totalActual,
      correctPredictions
    };

  } catch (error) {
    console.error('Error importing and comparing setlist:', error);
    return null;
  }
}

// Get existing comparison for a show
export async function getSetlistComparison(showId: string): Promise<ComparisonResult | null> {
  try {
    // Check if we already have a played setlist for this show
    const { data: playedSetlist } = await supabase
      .from('played_setlists')
      .select('*')
      .eq('show_id', showId)
      .single();

    if (!playedSetlist) {
      return null;
    }

    // Get predicted setlist
    const { data: setlistData } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (!setlistData) {
      return null;
    }

    const { data: predictedSongs } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        votes,
        position,
        songs!setlist_songs_song_id_fkey(id, name)
      `)
      .eq('setlist_id', setlistData.id)
      .order('votes', { ascending: false });

    // Get actual played songs
    const { data: actualSongs } = await supabase
      .from('played_setlist_songs')
      .select(`
        position,
        songs!played_setlist_songs_song_id_fkey(id, name)
      `)
      .eq('played_setlist_id', playedSetlist.id)
      .order('position');

    if (!predictedSongs || !actualSongs) {
      return null;
    }

    // Build comparison result
    const matches: SongMatch[] = [];
    const actualSongsWithMatches: ActualSong[] = actualSongs.map(as => {
      const predictedMatch = predictedSongs.find(ps => ps.songs.id === as.songs.id);
      
      if (predictedMatch) {
        matches.push({
          predictedSongId: predictedMatch.id,
          predictedName: predictedMatch.songs.name,
          actualName: as.songs.name,
          predictedPosition: predictedSongs.findIndex(ps => ps.id === predictedMatch.id) + 1,
          actualPosition: as.position,
          positionDiff: Math.abs((predictedSongs.findIndex(ps => ps.id === predictedMatch.id) + 1) - as.position)
        });
      }

      return {
        name: as.songs.name,
        position: as.position,
        matched: !!predictedMatch,
        matchedPredictedId: predictedMatch?.id
      };
    });

    const predictedSongsWithMatches: PredictedSong[] = predictedSongs.map((ps, index) => {
      const match = matches.find(m => m.predictedSongId === ps.id);
      return {
        id: ps.id,
        name: ps.songs.name,
        votes: ps.votes,
        position: index + 1,
        matched: !!match,
        matchedActualPosition: match?.actualPosition
      };
    });

    const correctPredictions = matches.length;
    const totalPredicted = predictedSongs.length;
    const totalActual = actualSongs.length;
    const accuracyScore = totalPredicted > 0 ? 
      (correctPredictions / Math.max(totalPredicted, totalActual)) * 100 : 0;

    return {
      showId,
      predictedSongs: predictedSongsWithMatches,
      actualSongs: actualSongsWithMatches,
      matches,
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      totalPredicted,
      totalActual,
      correctPredictions
    };

  } catch (error) {
    console.error('Error getting setlist comparison:', error);
    return null;
  }
}