
import { supabase } from "@/integrations/supabase/client";
import * as setlistfmService from "@/services/setlistfm";
import { SyncResult } from "./types";

export interface SetlistFmSong {
  name: string;
}

export interface SetlistFmSetlist {
  id: string;
  eventDate: string;
  artist: {
    name: string;
  };
  sets?: Array<{
    song?: SetlistFmSong[];
  }>;
}

// Import actual setlist from setlist.fm after a show
export async function importActualSetlist(showId: string): Promise<boolean> {
  try {
    console.log(`Importing actual setlist for show: ${showId}`);
    
    // Get show details with proper column hints
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artists!shows_artist_id_fkey (
          id,
          name
        )
      `)
      .eq('id', showId)
      .single();

    if (showError || !show) {
      console.error("Error fetching show:", showError);
      return false;
    }

    const artistName = (show.artists as any)?.name || 'Unknown Artist';
    console.log(`Found show for artist: ${artistName}`);

    // Check if we already have a played setlist for this show
    const { data: existingSetlist } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('show_id', showId)
      .single();

    if (existingSetlist) {
      console.log(`Played setlist already exists for show: ${showId}`);
      return true;
    }

    // Format date for setlist.fm API (DD-MM-YYYY)
    const showDate = new Date(show.date);
    const formattedDate = `${showDate.getDate().toString().padStart(2, '0')}-${(showDate.getMonth() + 1).toString().padStart(2, '0')}-${showDate.getFullYear()}`;

    // Search for setlists on setlist.fm
    const setlists = await setlistfmService.searchSetlists(artistName, formattedDate);
    
    if (setlists.length === 0) {
      console.log(`No setlists found for ${artistName} on ${formattedDate}`);
      return false;
    }

    const setlist = setlists[0];
    
    // Store the played setlist
    const playedSetlistId = await setlistfmService.storePlayedSetlist(
      showId,
      setlist.id,
      setlist.eventDate
    );
    
    if (!playedSetlistId) {
      console.error("Failed to store played setlist");
      return false;
    }

    // Get all songs from the setlist
    const songs = setlistfmService.flattenSetlistSongs(setlist);
    
    // Match and store each song
    let position = 1;
    for (const song of songs) {
      const songId = await setlistfmService.matchSongToDatabase(
        (show.artists as any)?.id,
        song.name
      );
      
      if (songId) {
        await setlistfmService.storePlayedSetlistSongs(
          playedSetlistId,
          songId,
          position
        );
        position++;
      }
    }

    console.log(`Successfully imported setlist for show: ${showId}`);
    return true;
  } catch (error) {
    console.error("Error importing actual setlist:", error);
    return false;
  }
}

// Import recent setlists for shows that occurred in the last 7 days
export async function importRecentSetlists(): Promise<SyncResult> {
  try {
    console.log("Importing recent setlists...");
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentShows, error } = await supabase
      .from('shows')
      .select('id, date')
      .gte('date', sevenDaysAgo.toISOString())
      .lt('date', new Date().toISOString());
    
    if (error) {
      console.error("Error fetching recent shows:", error);
      return {
        success: false,
        message: 'Failed to fetch recent shows'
      };
    }
    
    let importedCount = 0;
    
    for (const show of recentShows || []) {
      const success = await importActualSetlist(show.id);
      if (success) {
        importedCount++;
      }
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const message = `Imported ${importedCount} setlists from ${recentShows?.length || 0} recent shows`;
    console.log(message);
    
    return {
      success: importedCount > 0,
      message
    };
  } catch (error) {
    console.error("Error importing recent setlists:", error);
    return {
      success: false,
      message: 'Failed to import recent setlists'
    };
  }
}

// Match setlist.fm song to database song
export async function matchSongToDatabase(artistId: string, songName: string): Promise<string | null> {
  try {
    // Try exact match first
    const { data: exactMatch, error } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .ilike('name', songName)
      .limit(1)
      .single();

    if (!error && exactMatch) {
      return exactMatch.id;
    }

    // Try fuzzy matching
    const { data: fuzzyMatches, error: fuzzyError } = await supabase
      .rpc('match_song_similarity', {
        p_artist_id: artistId,
        p_song_name: songName,
        p_similarity_threshold: 0.7
      });

    if (!fuzzyError && fuzzyMatches && fuzzyMatches.length > 0) {
      return fuzzyMatches[0].id;
    }

    return null;
  } catch (error) {
    console.error("Error matching song to database:", error);
    return null;
  }
}
