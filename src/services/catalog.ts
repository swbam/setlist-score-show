import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import { toast } from "@/components/ui/sonner";

/**
 * Synchronizes an artist's catalog from Spotify and stores it in the database
 * @param artistId Spotify artist ID
 * @param forceUpdate Force update even if the artist was synced recently
 * @returns Success status
 */
export async function syncArtistCatalog(
  artistId: string, 
  forceUpdate: boolean = false
): Promise<boolean> {
  try {
    if (!artistId) {
      console.error("Invalid artist ID");
      return false;
    }
    
    console.log(`Syncing catalog for artist: ${artistId}`);
    
    // Check if we've already imported this artist's catalog recently
    if (!forceUpdate) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('last_synced_at')
        .eq('id', artistId)
        .single();
      
      // If we have this artist and they were synced less than 7 days ago, skip
      if (artist && artist.last_synced_at) {
        const lastSynced = new Date(artist.last_synced_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (lastSynced > sevenDaysAgo) {
          console.log(`Artist ${artistId} was synced recently (${lastSynced.toISOString()}), skipping catalog import`);
          return true;
        }
      }
    }
    
    // Get artist details from Spotify if not already in our database
    const artistExists = await checkArtistExists(artistId);
    
    if (!artistExists) {
      const artistData = await spotifyService.getArtist(artistId);
      if (!artistData) {
        console.error(`Failed to fetch artist data for: ${artistId}`);
        return false;
      }
      
      // Store artist in database
      await spotifyService.storeArtistInDatabase(artistData);
    }
    
    // Try to get all tracks first - this includes top tracks and tracks from albums
    let tracks = await spotifyService.getArtistAllTracks(artistId);
    
    // If that fails or returns no tracks, fall back to top tracks
    if (!tracks || tracks.length === 0) {
      console.log("No tracks found in full catalog, falling back to top tracks");
      tracks = await spotifyService.getArtistTopTracks(artistId);
    }
    
    if (!tracks || tracks.length === 0) {
      console.warn(`No tracks found for artist: ${artistId}`);
      return false;
    }
    
    console.log(`Found ${tracks.length} tracks for artist ${artistId}`);
    
    // Store tracks in database
    const tracksStored = await spotifyService.storeTracksInDatabase(artistId, tracks);
    if (!tracksStored) {
      console.error(`Failed to store tracks for artist: ${artistId}`);
      return false;
    }
    
    // Update last_synced_at for the artist
    const { error: updateError } = await supabase
      .from('artists')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', artistId);
    
    if (updateError) {
      console.error(`Failed to update last_synced_at for artist: ${artistId}`, updateError);
    }
    
    console.log(`Successfully synced catalog for artist: ${artistId}`);
    return true;
  } catch (error) {
    console.error(`Error syncing catalog for artist: ${artistId}`, error);
    return false;
  }
}

/**
 * Checks if an artist exists in the database
 */
async function checkArtistExists(artistId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('artists')
    .select('id')
    .eq('id', artistId)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking if artist exists:", error);
    return false;
  }
  
  return !!data;
}

/**
 * Gets the song catalog for an artist from the database
 */
export async function getArtistSongCatalog(artistId: string): Promise<any[]> {
  try {
    // First, try to get songs from our database
    const { data: dbSongs, error: dbError } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false });
      
    if (dbError) {
      console.error("Error fetching songs from database:", dbError);
      return [];
    }
    
    // If we have songs in database, return them
    if (dbSongs && dbSongs.length > 0) {
      console.log(`Found ${dbSongs.length} songs in database for artist ${artistId}`);
      return dbSongs;
    }
    
    // If not, sync artist catalog and try again
    console.log(`No songs found in database for artist ${artistId}, syncing catalog...`);
    const synced = await syncArtistCatalog(artistId);
    
    if (!synced) {
      console.error(`Failed to sync catalog for artist ${artistId}`);
      return [];
    }
    
    // Try getting songs again after sync
    const { data: syncedSongs, error: syncError } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false });
      
    if (syncError) {
      console.error("Error fetching songs after sync:", syncError);
      return [];
    }
    
    return syncedSongs || [];
  } catch (error) {
    console.error(`Error getting song catalog for artist ${artistId}:`, error);
    return [];
  }
}

/**
 * Gets random songs from an artist's catalog to seed a setlist
 */
export async function getRandomSongsForSetlist(artistId: string, count: number = 5): Promise<any[]> {
  try {
    // First ensure we have the artist's catalog
    await syncArtistCatalog(artistId);
    
    // Get random songs from the database
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)
      .order('popularity', { ascending: false })
      .limit(50); // Get top 50 songs by popularity
      
    if (error || !songs || songs.length === 0) {
      console.error("Error fetching songs for random selection:", error);
      return [];
    }
    
    // If we have fewer songs than requested, return all available songs
    if (songs.length <= count) {
      return songs;
    }
    
    // Otherwise, select random songs
    const selectedSongs: any[] = [];
    const usedIndices = new Set<number>();
    
    // First, try to include some popular songs (top 20%)
    const popularSongCount = Math.min(Math.floor(count / 2), Math.floor(songs.length * 0.2));
    for (let i = 0; i < popularSongCount; i++) {
      selectedSongs.push(songs[i]);
      usedIndices.add(i);
    }
    
    // Then fill the rest with random selections
    while (selectedSongs.length < count) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      
      if (!usedIndices.has(randomIndex)) {
        selectedSongs.push(songs[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    return selectedSongs;
  } catch (error) {
    console.error("Error getting random songs for setlist:", error);
    return [];
  }
}
