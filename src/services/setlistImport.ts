import { supabase } from "@/integrations/supabase/client";
import * as setlistfmService from "./setlistfm";

// Types for import process
export interface ImportResult {
  success: boolean;
  playedSetlistId?: string;
  songsImported?: number;
  error?: string;
}

export interface ShowWithDetails {
  id: string;
  date: string;
  artist_id: string;
  artist?: {
    id: string;
    name: string;
  };
  venue?: {
    city: string;
    state?: string;
    country: string;
  };
}

/**
 * Import played setlist for a specific show
 */
export async function importPlayedSetlistForShow(showId: string): Promise<ImportResult> {
  try {
    console.log(`Starting setlist import for show: ${showId}`);
    
    // Get show details including artist
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artist_id,
        artist:artists(id, name),
        venue:venues(city, state, country)
      `)
      .eq('id', showId)
      .single();
      
    if (showError || !show) {
      console.error("Error fetching show details:", showError);
      return { success: false, error: "Show not found" };
    }
    
    const showData = show as ShowWithDetails;
    
    if (!showData.artist) {
      return { success: false, error: "Artist information not found" };
    }
    
    // Format date for setlist.fm search (DD-MM-YYYY)
    const eventDate = new Date(showData.date);
    const formattedDate = `${String(eventDate.getDate()).padStart(2, '0')}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${eventDate.getFullYear()}`;
    
    console.log(`Searching setlist.fm for ${showData.artist.name} on ${formattedDate}`);
    
    // Search for setlists
    const setlists = await setlistfmService.searchSetlists(showData.artist.name, formattedDate);
    
    if (!setlists || setlists.length === 0) {
      console.log("No setlists found on setlist.fm");
      return { success: false, error: "No setlist found for this show" };
    }
    
    // Find the best matching setlist (by venue name if possible)
    let bestMatch = setlists[0]; // Default to first result
    
    if (showData.venue && setlists.length > 1) {
      // Try to match by venue city
      const venueMatch = setlists.find(s => 
        s.venue?.city?.name?.toLowerCase() === showData.venue?.city?.toLowerCase()
      );
      
      if (venueMatch) {
        bestMatch = venueMatch;
      }
    }
    
    console.log(`Found setlist: ${bestMatch.id} at ${bestMatch.venue?.name}`);
    
    // Check if we've already imported this setlist
    const { data: existingImport } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();
      
    if (existingImport) {
      console.log("Setlist already imported for this show");
      return { success: true, playedSetlistId: existingImport.id, error: "Setlist already imported" };
    }
    
    // Store played setlist
    const playedSetlistId = await setlistfmService.storePlayedSetlist(
      showId,
      bestMatch.id,
      bestMatch.eventDate
    );
    
    if (!playedSetlistId) {
      return { success: false, error: "Failed to store played setlist" };
    }
    
    // Get all songs from the setlist
    const songs = setlistfmService.flattenSetlistSongs(bestMatch);
    console.log(`Found ${songs.length} songs in the setlist`);
    
    if (songs.length === 0) {
      return { 
        success: true, 
        playedSetlistId, 
        songsImported: 0,
        error: "No songs found in setlist" 
      };
    }
    
    // Import each song
    let importedCount = 0;
    
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const position = i + 1;
      
      // Match song to our database
      const songId = await setlistfmService.matchSongToDatabase(
        showData.artist_id,
        song.name
      );
      
      if (songId) {
        // Store in played_setlist_songs
        const stored = await setlistfmService.storePlayedSetlistSongs(
          playedSetlistId,
          songId,
          position
        );
        
        if (stored) {
          importedCount++;
        }
      } else {
        console.warn(`Could not match song "${song.name}" to database`);
        
        // Create a placeholder song entry
        const { data: newSong, error: songError } = await supabase
          .from('songs')
          .insert({
            id: `temp_${Date.now()}_${i}`, // Temporary ID
            artist_id: showData.artist_id,
            name: song.name,
            album: 'Unknown Album',
            duration_ms: 0,
            popularity: 0,
            spotify_url: ''
          })
          .select()
          .single();
          
        if (newSong && !songError) {
          const stored = await setlistfmService.storePlayedSetlistSongs(
            playedSetlistId,
            newSong.id,
            position
          );
          
          if (stored) {
            importedCount++;
          }
        }
      }
    }
    
    console.log(`Successfully imported ${importedCount} of ${songs.length} songs`);
    
    return {
      success: true,
      playedSetlistId,
      songsImported: importedCount
    };
  } catch (error) {
    console.error("Error importing played setlist:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Import setlists for all shows that occurred in the last N days
 */
export async function importRecentShowSetlists(daysBack: number = 1): Promise<{
  showsProcessed: number;
  setlistsImported: number;
  errors: string[];
}> {
  try {
    console.log(`Importing setlists for shows from the last ${daysBack} days`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Get shows that occurred in this date range
    const { data: recentShows, error: showsError } = await supabase
      .from('shows')
      .select(`
        id,
        date,
        artist_id,
        artist:artists(id, name)
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .eq('status', 'scheduled'); // Only process scheduled shows (not canceled/postponed)
      
    if (showsError || !recentShows) {
      console.error("Error fetching recent shows:", showsError);
      return { showsProcessed: 0, setlistsImported: 0, errors: ["Failed to fetch recent shows"] };
    }
    
    console.log(`Found ${recentShows.length} shows to process`);
    
    let showsProcessed = 0;
    let setlistsImported = 0;
    const errors: string[] = [];
    
    // Process each show
    for (const show of recentShows) {
      showsProcessed++;
      
      // Check if show date has passed
      const showDate = new Date(show.date);
      if (showDate > new Date()) {
        console.log(`Show ${show.id} hasn't occurred yet, skipping`);
        continue;
      }
      
      // Check if we've already imported this show's setlist
      const { data: existingImport } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', show.id)
        .maybeSingle();
        
      if (existingImport) {
        console.log(`Setlist already imported for show ${show.id}`);
        continue;
      }
      
      // Import the setlist
      const result = await importPlayedSetlistForShow(show.id);
      
      if (result.success && result.songsImported && result.songsImported > 0) {
        setlistsImported++;
      } else if (!result.success) {
        errors.push(`Show ${show.id}: ${result.error || 'Unknown error'}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Processed ${showsProcessed} shows, imported ${setlistsImported} setlists`);
    
    return {
      showsProcessed,
      setlistsImported,
      errors
    };
  } catch (error) {
    console.error("Error in importRecentShowSetlists:", error);
    return {
      showsProcessed: 0,
      setlistsImported: 0,
      errors: ["An unexpected error occurred"]
    };
  }
}

/**
 * Get the played setlist for a show
 */
export async function getPlayedSetlistForShow(showId: string): Promise<{
  playedSetlist: any | null;
  songs: Array<{
    position: number;
    song: any;
  }>;
}> {
  try {
    // Get played setlist
    const { data: playedSetlist, error: setlistError } = await supabase
      .from('played_setlists')
      .select('*')
      .eq('show_id', showId)
      .maybeSingle();
      
    if (setlistError || !playedSetlist) {
      return { playedSetlist: null, songs: [] };
    }
    
    // Get songs in the played setlist
    const { data: playedSongs, error: songsError } = await supabase
      .from('played_setlist_songs')
      .select(`
        position,
        song:songs(*)
      `)
      .eq('played_setlist_id', playedSetlist.id)
      .order('position', { ascending: true });
      
    if (songsError) {
      console.error("Error fetching played setlist songs:", songsError);
      return { playedSetlist, songs: [] };
    }
    
    return {
      playedSetlist,
      songs: playedSongs || []
    };
  } catch (error) {
    console.error("Error getting played setlist:", error);
    return { playedSetlist: null, songs: [] };
  }
} 