import { supabase } from "@/integrations/supabase/client";

// setlist.fm API configuration
const SETLISTFM_API_BASE = "https://api.setlist.fm/rest/1.0";
const SETLISTFM_API_KEY = "xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL";

// Types for setlist.fm API responses
export interface SetlistFmSetlist {
  id: string;
  versionId: string;
  eventDate: string;
  lastUpdated: string;
  artist: {
    mbid: string;
    name: string;
    sortName: string;
    disambiguation?: string;
    url: string;
  };
  venue: {
    id: string;
    name: string;
    city: {
      id: string;
      name: string;
      state?: string;
      stateCode?: string;
      coords: {
        lat: number;
        long: number;
      };
      country: {
        code: string;
        name: string;
      };
    };
    url: string;
  };
  tour?: {
    name: string;
  };
  sets: {
    set: Array<{
      name?: string;
      encore?: number;
      song: Array<{
        name: string;
        with?: {
          mbid: string;
          name: string;
          sortName: string;
          disambiguation?: string;
          url: string;
        };
        cover?: {
          mbid: string;
          name: string;
          sortName: string;
          disambiguation?: string;
          url: string;
        };
        info?: string;
        tape?: boolean;
      }>;
    }>;
  };
  info?: string;
  url: string;
}

export interface SetlistFmSearchResponse {
  type: string;
  itemsPerPage: number;
  page: number;
  total: number;
  setlist: SetlistFmSetlist[];
}

export interface PlayedSetlistData {
  id: string;
  show_id: string;
  setlist_fm_id: string;
  played_date: string;
  imported_at: string;
  songs: Array<{
    id: string;
    song_id: string;
    position: number;
    encore?: number;
    name: string;
    is_cover: boolean;
    cover_artist?: string;
    info?: string;
  }>;
}

// Helper function to make API calls to setlist.fm
async function setlistFmApiCall<T>(endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${SETLISTFM_API_BASE}${endpoint}`, {
      headers: {
        "Accept": "application/json",
        "x-api-key": SETLISTFM_API_KEY
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`setlist.fm: No data found for ${endpoint}`);
        return null;
      }
      
      const errorText = await response.text();
      console.error("setlist.fm API error:", response.status, errorText);
      throw new Error(`Failed to fetch from setlist.fm API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching from setlist.fm API:", error);
    throw error;
  }
}

// Search for setlists by artist name and date
export async function searchSetlists(
  artistName: string,
  date?: string,
  venueName?: string,
  cityName?: string
): Promise<SetlistFmSetlist[]> {
  try {
    console.log(`🔍 Searching setlist.fm for: ${artistName}${date ? ` on ${date}` : ''}${venueName ? ` at ${venueName}` : ''}`);
    
    // Build search parameters
    const params = new URLSearchParams();
    params.append('artistName', artistName);
    
    if (date) {
      // Convert date to setlist.fm format (dd-MM-yyyy)
      const dateObj = new Date(date);
      const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
      params.append('date', formattedDate);
    }
    
    if (venueName) {
      params.append('venueName', venueName);
    }
    
    if (cityName) {
      params.append('cityName', cityName);
    }

    const response = await setlistFmApiCall<SetlistFmSearchResponse>(
      `/search/setlists?${params.toString()}`
    );

    if (response?.setlist) {
      console.log(`📋 Found ${response.setlist.length} setlists for ${artistName}`);
      return response.setlist;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching setlists:", error);
    return [];
  }
}

// Get a specific setlist by ID
export async function getSetlist(setlistId: string): Promise<SetlistFmSetlist | null> {
  try {
    console.log(`📋 Fetching setlist: ${setlistId}`);
    
    const setlist = await setlistFmApiCall<SetlistFmSetlist>(`/setlist/${setlistId}`);
    
    if (setlist) {
      console.log(`✅ Found setlist for ${setlist.artist.name} on ${setlist.eventDate}`);
    }
    
    return setlist;
  } catch (error) {
    console.error(`Error fetching setlist ${setlistId}:`, error);
    return null;
  }
}

// Match a song name to an existing song in our database
async function matchSongToDatabase(artistId: string, songName: string): Promise<string | null> {
  try {
    // First try exact match
    const { data: exactMatch } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .ilike('name', songName)
      .limit(1)
      .single();

    if (exactMatch) {
      console.log(`🎯 Exact match found for "${songName}"`);
      return exactMatch.id;
    }

    // Try fuzzy matching (remove common words and punctuation)
    const cleanSongName = songName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '')
      .trim();

    const { data: fuzzyMatches } = await supabase
      .from('songs')
      .select('id, name')
      .eq('artist_id', artistId);

    if (fuzzyMatches) {
      for (const song of fuzzyMatches) {
        const cleanDbName = song.name
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/g, '')
          .trim();

        // Check if names are similar (simple contains check)
        if (cleanDbName.includes(cleanSongName) || cleanSongName.includes(cleanDbName)) {
          console.log(`🎯 Fuzzy match found: "${songName}" -> "${song.name}"`);
          return song.id;
        }
      }
    }

    console.log(`❌ No match found for "${songName}" in artist ${artistId} catalog`);
    return null;
  } catch (error) {
    console.error(`Error matching song "${songName}":`, error);
    return null;
  }
}

// Import a played setlist from setlist.fm
export async function importPlayedSetlist(
  showId: string,
  setlistFmId?: string
): Promise<PlayedSetlistData | null> {
  try {
    console.log(`🎭 Importing played setlist for show: ${showId}`);

    // Get show details
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist:artists!shows_artist_id_fkey (
          id,
          name
        ),
        venue:venues!shows_venue_id_fkey (
          name,
          city,
          state
        )
      `)
      .eq('id', showId)
      .single();

    if (showError || !show) {
      throw new Error(`Show not found: ${showId}`);
    }

    let setlist: SetlistFmSetlist | null = null;

    if (setlistFmId) {
      // Use provided setlist ID
      setlist = await getSetlist(setlistFmId);
    } else {
      // Search for setlist by artist, date, and venue
      const setlists = await searchSetlists(
        show.artist.name,
        show.date,
        show.venue?.name,
        show.venue?.city
      );

      if (setlists.length > 0) {
        // Use the first (most relevant) setlist
        setlist = setlists[0];
        console.log(`🎯 Auto-matched setlist: ${setlist.id}`);
      }
    }

    if (!setlist) {
      console.log(`❌ No setlist found for show ${showId}`);
      return null;
    }

    // Check if we already imported this setlist
    const { data: existingImport } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('show_id', showId)
      .eq('setlist_fm_id', setlist.id)
      .single();

    if (existingImport) {
      console.log(`ℹ️ Setlist already imported for show ${showId}`);
      return null;
    }

    // Create played setlist record
    const { data: playedSetlist, error: playedSetlistError } = await supabase
      .from('played_setlists')
      .insert({
        show_id: showId,
        setlist_fm_id: setlist.id,
        played_date: setlist.eventDate,
        imported_at: new Date().toISOString()
      })
      .select()
      .single();

    if (playedSetlistError || !playedSetlist) {
      throw new Error(`Failed to create played setlist: ${playedSetlistError?.message}`);
    }

    // Process and import songs
    const importedSongs: PlayedSetlistData['songs'] = [];
    let position = 1;

    for (const setData of setlist.sets.set) {
      const isEncore = setData.encore || 0;
      
      for (const songData of setData.song) {
        console.log(`🎵 Processing song: ${songData.name}${songData.cover ? ` (cover of ${songData.cover.name})` : ''}`);
        
        // Try to match song to our database
        const songId = await matchSongToDatabase(show.artist.id, songData.name);
        
        if (songId) {
          // Create played setlist song record
          const { data: playedSong, error: playedSongError } = await supabase
            .from('played_setlist_songs')
            .insert({
              played_setlist_id: playedSetlist.id,
              song_id: songId,
              position: position
            })
            .select()
            .single();

          if (!playedSongError && playedSong) {
            importedSongs.push({
              id: playedSong.id,
              song_id: songId,
              position: position,
              encore: isEncore > 0 ? isEncore : undefined,
              name: songData.name,
              is_cover: !!songData.cover,
              cover_artist: songData.cover?.name,
              info: songData.info
            });
          }
        } else {
          console.log(`⚠️ Could not match "${songData.name}" to database, skipping`);
        }
        
        position++;
      }
    }

    console.log(`✅ Successfully imported setlist with ${importedSongs.length} songs for show ${showId}`);

    return {
      id: playedSetlist.id,
      show_id: showId,
      setlist_fm_id: setlist.id,
      played_date: setlist.eventDate,
      imported_at: playedSetlist.imported_at,
      songs: importedSongs
    };

  } catch (error) {
    console.error(`Error importing played setlist for show ${showId}:`, error);
    throw error;
  }
}

// Get played setlist for a show
export async function getPlayedSetlist(showId: string): Promise<PlayedSetlistData | null> {
  try {
    const { data: playedSetlist, error } = await supabase
      .from('played_setlists')
      .select(`
        id,
        show_id,
        setlist_fm_id,
        played_date,
        imported_at,
        played_setlist_songs!played_setlist_songs_played_setlist_id_fkey (
          id,
          song_id,
          position,
          songs!played_setlist_songs_song_id_fkey (
            name
          )
        )
      `)
      .eq('show_id', showId)
      .single();

    if (error || !playedSetlist) {
      return null;
    }

    const songs = playedSetlist.played_setlist_songs.map(pss => ({
      id: pss.id,
      song_id: pss.song_id,
      position: pss.position,
      name: pss.songs.name,
      is_cover: false, // TODO: Store this info
      cover_artist: undefined,
      info: undefined
    }));

    return {
      id: playedSetlist.id,
      show_id: playedSetlist.show_id,
      setlist_fm_id: playedSetlist.setlist_fm_id,
      played_date: playedSetlist.played_date,
      imported_at: playedSetlist.imported_at,
      songs: songs.sort((a, b) => a.position - b.position)
    };

  } catch (error) {
    console.error(`Error fetching played setlist for show ${showId}:`, error);
    return null;
  }
}

// Compare predicted vs actual setlist
export async function compareSetlists(showId: string): Promise<{
  predicted: Array<{id: string; name: string; votes: number; predicted_position: number}>;
  actual: Array<{id: string; name: string; actual_position: number}>;
  matches: Array<{song_id: string; name: string; predicted_position: number; actual_position: number}>;
  accuracy: number;
} | null> {
  try {
    console.log(`📊 Comparing setlists for show: ${showId}`);

    // Get predicted setlist (voting results)
    const { data: predictedSetlist } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        song_id,
        votes,
        songs!setlist_songs_song_id_fkey (
          name
        ),
        setlists!setlist_songs_setlist_id_fkey (
          show_id
        )
      `)
      .eq('setlists.show_id', showId)
      .order('votes', { ascending: false });

    // Get actual setlist
    const actualSetlist = await getPlayedSetlist(showId);

    if (!predictedSetlist || !actualSetlist) {
      console.log(`❌ Missing setlist data for comparison`);
      return null;
    }

    // Prepare data
    const predicted = predictedSetlist.map((song, index) => ({
      id: song.song_id,
      name: song.songs.name,
      votes: song.votes,
      predicted_position: index + 1
    }));

    const actual = actualSetlist.songs.map(song => ({
      id: song.song_id,
      name: song.name,
      actual_position: song.position
    }));

    // Find matches
    const matches = predicted
      .filter(pSong => actual.some(aSong => aSong.id === pSong.id))
      .map(pSong => {
        const aSong = actual.find(aSong => aSong.id === pSong.id)!;
        return {
          song_id: pSong.id,
          name: pSong.name,
          predicted_position: pSong.predicted_position,
          actual_position: aSong.actual_position
        };
      });

    // Calculate accuracy (percentage of predicted songs that were actually played)
    const accuracy = predicted.length > 0 ? (matches.length / predicted.length) * 100 : 0;

    console.log(`📈 Setlist comparison complete: ${matches.length}/${predicted.length} songs matched (${accuracy.toFixed(1)}% accuracy)`);

    return {
      predicted,
      actual,
      matches,
      accuracy
    };

  } catch (error) {
    console.error(`Error comparing setlists for show ${showId}:`, error);
    return null;
  }
}

// Batch import setlists for shows after they occur
export async function batchImportRecentSetlists(daysBack: number = 7): Promise<{
  processed: number;
  imported: number;
  errors: string[];
}> {
  try {
    console.log(`🔄 Starting batch import of setlists from last ${daysBack} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Get shows from the last week that don't have played setlists
    const { data: shows, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist:artists!shows_artist_id_fkey (
          id,
          name
        ),
        venue:venues!shows_venue_id_fkey (
          name,
          city,
          state
        )
      `)
      .gte('date', cutoffDate.toISOString())
      .lte('date', new Date().toISOString()) // Only past shows
      .not('id', 'in', 
        supabase.from('played_setlists').select('show_id')
      );

    if (error) {
      throw error;
    }

    if (!shows || shows.length === 0) {
      console.log(`ℹ️ No recent shows found for setlist import`);
      return { processed: 0, imported: 0, errors: [] };
    }

    console.log(`🎯 Found ${shows.length} recent shows to process`);

    let processed = 0;
    let imported = 0;
    const errors: string[] = [];

    for (const show of shows) {
      try {
        processed++;
        console.log(`🎭 Processing show ${processed}/${shows.length}: ${show.artist.name} on ${show.date}`);

        const result = await importPlayedSetlist(show.id);
        
        if (result) {
          imported++;
          console.log(`✅ Imported setlist for ${show.artist.name}: ${result.songs.length} songs`);
        } else {
          console.log(`ℹ️ No setlist found for ${show.artist.name} on ${show.date}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        const errorMsg = `Error processing ${show.artist.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`🎉 Batch import completed: ${imported}/${processed} shows imported`);

    return {
      processed,
      imported,
      errors
    };

  } catch (error) {
    console.error('Error in batch setlist import:', error);
    throw error;
  }
}