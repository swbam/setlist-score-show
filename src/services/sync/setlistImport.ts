
import { supabase } from "@/integrations/supabase/client";

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
    
    // Get show details
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

    const artistName = show.artists?.name || 'Unknown Artist';
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

    // TODO: Implement actual setlist.fm API call here
    // For now, return true as placeholder
    console.log(`Setlist import placeholder for show: ${showId}`);
    return true;
  } catch (error) {
    console.error("Error importing actual setlist:", error);
    return false;
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
