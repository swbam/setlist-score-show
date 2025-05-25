
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "./spotify";

// Ensure a setlist exists for a given show, creating one with 5 random songs if necessary
export async function ensureSetlistExists(showId: string): Promise<string | null> {
  try {
    console.log("Ensuring setlist exists for show:", showId);
    
    // First check if a setlist already exists for this show
    const { data: existingSetlist, error: setlistError } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .maybeSingle();

    if (setlistError) {
      console.error("Error checking existing setlist:", setlistError);
      return null;
    }

    if (existingSetlist) {
      console.log("Found existing setlist:", existingSetlist.id);
      
      // Check if it has songs
      const { data: existingSongs, error: songsError } = await supabase
        .from('setlist_songs')
        .select('id')
        .eq('setlist_id', existingSetlist.id)
        .limit(1);

      if (songsError) {
        console.error("Error checking existing songs:", songsError);
        return existingSetlist.id;
      }

      if (existingSongs && existingSongs.length > 0) {
        console.log("Setlist already has songs, returning existing setlist");
        return existingSetlist.id;
      }

      // Setlist exists but has no songs, we'll add them
      console.log("Setlist exists but has no songs, adding songs...");
      const songsAdded = await addSongsToSetlist(existingSetlist.id, showId);
      return songsAdded ? existingSetlist.id : null;
    }

    // No setlist exists, create one with the database function
    console.log("Creating new setlist with songs for show:", showId);
    
    // Get artist ID first to ensure we have songs
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();

    if (showError || !showData) {
      console.error("Error fetching show data:", showError);
      return null;
    }

    // Check if we have songs for this artist, if not import them
    const { data: existingSongs, error: songsCheckError } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', showData.artist_id)
      .limit(1);

    if (songsCheckError) {
      console.error("Error checking for existing songs:", songsCheckError);
    }

    // If no songs exist for this artist, import from Spotify
    if (!existingSongs || existingSongs.length === 0) {
      console.log("No songs found for artist, importing from Spotify...");
      const imported = await spotifyService.importArtistCatalog(showData.artist_id);
      if (!imported) {
        console.error("Failed to import artist catalog");
        return null;
      }
    }

    // Now try to use the database function to create setlist with songs
    try {
      const { data: result, error: createError } = await supabase
        .rpc('create_setlist_with_songs', { p_show_id: showId });

      if (createError) {
        console.error("Error creating setlist with songs:", createError);
        // Fallback to manual creation
        return await createSetlistManually(showId);
      }

      if (result && Array.isArray(result) && result.length > 0) {
        console.log(`Created setlist with ${result[0].songs_added} songs`);
        return result[0].setlist_id;
      }

      return null;
    } catch (error) {
      console.error("Database function not available, using manual creation:", error);
      return await createSetlistManually(showId);
    }

  } catch (error) {
    console.error("Error in ensureSetlistExists:", error);
    return null;
  }
}

// Fallback manual setlist creation
async function createSetlistManually(showId: string): Promise<string | null> {
  try {
    // Create new setlist
    const { data: newSetlist, error: createError } = await supabase
      .from('setlists')
      .insert({
        show_id: showId
      })
      .select('id')
      .single();

    if (createError) {
      console.error("Error creating setlist manually:", createError);
      return null;
    }

    if (!newSetlist) {
      console.error("No setlist returned after creation");
      return null;
    }

    console.log("Created new setlist manually:", newSetlist.id);

    // Add initial songs to the new setlist
    const songsAdded = await addSongsToSetlist(newSetlist.id, showId);
    return songsAdded ? newSetlist.id : null;
  } catch (error) {
    console.error("Error in createSetlistManually:", error);
    return null;
  }
}

// Add initial 5 random songs to a setlist
async function addSongsToSetlist(setlistId: string, showId: string): Promise<boolean> {
  try {
    console.log("Adding 5 random songs to setlist:", setlistId);
    
    // Get the artist ID from the show
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select('artist_id')
      .eq('id', showId)
      .single();

    if (showError || !showData) {
      console.error("Error fetching show data:", showError);
      return false;
    }

    const artistId = showData.artist_id;
    console.log("Artist ID for show:", artistId);

    // Get 5 random songs for this artist from the database
    const { data: artistSongs, error: songsError } = await supabase
      .from('songs')
      .select('id, name, album, popularity')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(50); // Get top 50 to choose from

    if (songsError) {
      console.error("Error fetching artist songs:", songsError);
      return false;
    }

    if (!artistSongs || artistSongs.length === 0) {
      console.log("No songs found in database");
      return false;
    }

    console.log(`Found ${artistSongs.length} songs for artist`);

    // Randomly select 5 songs from the available songs
    const shuffledSongs = [...artistSongs].sort(() => Math.random() - 0.5);
    const selectedSongs = shuffledSongs.slice(0, Math.min(5, shuffledSongs.length));

    console.log(`Selected ${selectedSongs.length} songs for initial setlist`);

    // Insert the selected songs into the setlist with 0 votes
    const setlistSongsToInsert = selectedSongs.map((song, index) => ({
      setlist_id: setlistId,
      song_id: song.id,
      position: index + 1,
      votes: 0
    }));

    const { error: insertError } = await supabase
      .from('setlist_songs')
      .insert(setlistSongsToInsert);

    if (insertError) {
      console.error("Error inserting setlist songs:", insertError);
      return false;
    }

    console.log(`Successfully added ${selectedSongs.length} songs to setlist with 0 votes each`);
    return true;

  } catch (error) {
    console.error("Error in addSongsToSetlist:", error);
    return false;
  }
}

// Get setlist for a show
export async function getSetlistForShow(showId: string) {
  try {
    const { data: setlist, error } = await supabase
      .from('setlists')
      .select(`
        id,
        show_id,
        created_at,
        updated_at,
        setlist_songs (
          id,
          song_id,
          votes,
          position,
          songs!fk_setlist_songs_song_id (
            id,
            name,
            album,
            spotify_url
          )
        )
      `)
      .eq('show_id', showId)
      .single();

    if (error) {
      console.error("Error fetching setlist:", error);
      return null;
    }

    return setlist;
  } catch (error) {
    console.error("Error in getSetlistForShow:", error);
    return null;
  }
}
