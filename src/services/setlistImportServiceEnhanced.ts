
import { supabase } from '@/integrations/supabase/client';

interface SetlistFmShow {
  id: string;
  eventDate: string;
  artist: {
    name: string;
    mbid?: string;
  };
  venue: {
    name: string;
    city: {
      name: string;
      state?: string;
      country: string;
    };
  };
  sets?: {
    set: Array<{
      song: Array<{
        name: string;
        with?: {
          name: string;
        };
        cover?: {
          name: string;
        };
      }>;
    }>;
  };
}

interface PlayedSetlistImportResult {
  success: boolean;
  message: string;
  playedSetlistId?: string;
  songsAdded?: number;
}

export class SetlistImportServiceEnhanced {
  
  /**
   * Import actual performed setlist from setlist.fm for a show
   */
  async importPlayedSetlistForShow(showId: string): Promise<PlayedSetlistImportResult> {
    try {
      console.log(`🎵 Starting setlist import for show: ${showId}`);

      // Get show details from database with proper relationship hints
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          artists!shows_artist_id_fkey(id, name),
          venues!shows_venue_id_fkey(name, city, state, country)
        `)
        .eq('id', showId)
        .single();

      if (showError || !show) {
        console.error('Show not found:', showError);
        return {
          success: false,
          message: `Show not found: ${showId}`
        };
      }

      const artistData = show.artists as any;
      const venueData = show.venues as any;
      
      const artistName = artistData?.name || 'Unknown Artist';
      const showDate = new Date(show.date);
      const venueName = venueData?.name || 'Unknown Venue';
      const cityName = venueData?.city || '';

      console.log(`🔍 Searching setlist.fm for: ${artistName} on ${showDate.toDateString()} at ${venueName}`);

      // Search setlist.fm for the show
      const setlistData = await this.searchSetlistFm(artistName, showDate, venueName, cityName);

      if (!setlistData) {
        return {
          success: false,
          message: 'No setlist found on setlist.fm for this show'
        };
      }

      // Check if we already imported this setlist
      const { data: existingSetlist } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', showId)
        .eq('setlist_fm_id', setlistData.id)
        .single();

      if (existingSetlist) {
        return {
          success: true,
          message: 'Setlist already imported',
          playedSetlistId: existingSetlist.id
        };
      }

      // Create played setlist record
      const { data: playedSetlist, error: playedSetlistError } = await supabase
        .from('played_setlists')
        .insert({
          show_id: showId,
          setlist_fm_id: setlistData.id,
          played_date: showDate.toISOString(),
          imported_at: new Date().toISOString()
        })
        .select()
        .single();

      if (playedSetlistError || !playedSetlist) {
        console.error('Error creating played setlist:', playedSetlistError);
        return {
          success: false,
          message: 'Failed to create played setlist record'
        };
      }

      // Extract songs from setlist
      const songs = this.extractSongsFromSetlist(setlistData);
      console.log(`🎵 Extracted ${songs.length} songs from setlist`);

      let songsAdded = 0;
      let position = 1;

      // Process each song
      for (const songName of songs) {
        try {
          // Try to find the song in our database
          const songId = await this.findOrCreateSong(artistData?.id || '', songName);

          if (songId) {
            // Add to played setlist songs
            const { error: songError } = await supabase
              .from('played_setlist_songs')
              .insert({
                played_setlist_id: playedSetlist.id,
                song_id: songId,
                position: position
              });

            if (!songError) {
              songsAdded++;
              position++;
            } else {
              console.error(`Error adding song ${songName}:`, songError);
            }
          }
        } catch (error) {
          console.error(`Error processing song ${songName}:`, error);
        }
      }

      console.log(`✅ Successfully imported setlist with ${songsAdded} songs`);

      return {
        success: true,
        message: `Successfully imported setlist with ${songsAdded} songs`,
        playedSetlistId: playedSetlist.id,
        songsAdded
      };

    } catch (error) {
      console.error('Error importing setlist:', error);
      return {
        success: false,
        message: `Error importing setlist: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search setlist.fm for a specific show
   */
  private async searchSetlistFm(
    artistName: string, 
    showDate: Date, 
    venueName: string, 
    cityName: string
  ): Promise<SetlistFmShow | null> {
    try {
      // Format date for setlist.fm API (dd-mm-yyyy)
      const formattedDate = `${showDate.getDate().toString().padStart(2, '0')}-${(showDate.getMonth() + 1).toString().padStart(2, '0')}-${showDate.getFullYear()}`;

      // Basic search implementation - would use actual setlist.fm API
      console.log(`Searching setlist.fm for ${artistName} on ${formattedDate}`);
      
      // Return null for now - would implement actual API call
      return null;
    } catch (error) {
      console.error('Error searching setlist.fm:', error);
      return null;
    }
  }

  /**
   * Extract songs from setlist.fm data structure
   */
  private extractSongsFromSetlist(setlistData: SetlistFmShow): string[] {
    const songs: string[] = [];

    if (!setlistData.sets?.set) {
      return songs;
    }

    // Flatten all songs from all sets
    for (const set of setlistData.sets.set) {
      if (set.song) {
        for (const song of set.song) {
          let songName = song.name;

          // Handle covers and collaborations
          if (song.cover) {
            songName = `${songName} (${song.cover.name} cover)`;
          }
          if (song.with) {
            songName = `${songName} (with ${song.with.name})`;
          }

          songs.push(songName);
        }
      }
    }

    return songs;
  }

  /**
   * Find existing song or create new one
   */
  private async findOrCreateSong(artistId: string, songName: string): Promise<string | null> {
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
        return exactMatch.id;
      }

      // If no match found, create a new song entry
      const { data: newSong } = await supabase
        .from('songs')
        .insert({
          id: `spotify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          artist_id: artistId,
          name: songName,
          album: 'Unknown Album',
          duration_ms: 0,
          popularity: 0,
          spotify_url: ''
        })
        .select()
        .single();

      return newSong?.id || null;
    } catch (error) {
      console.error('Error finding/creating song:', error);
      return null;
    }
  }

  /**
   * Calculate accuracy of fan predictions vs actual setlist
   */
  async calculatePredictionAccuracy(showId: string): Promise<number> {
    try {
      // Get fan-voted setlist with proper relationship hints
      const { data: fanSetlist } = await supabase
        .from('setlists')
        .select(`
          setlist_songs!setlists_id_fkey(
            song_id,
            votes,
            songs!setlist_songs_song_id_fkey(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      // Get actual played setlist with proper relationship hints
      const { data: playedSetlist } = await supabase
        .from('played_setlists')
        .select(`
          played_setlist_songs!played_setlists_id_fkey(
            song_id,
            position,
            songs!played_setlist_songs_song_id_fkey(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      if (!fanSetlist || !playedSetlist) {
        return 0;
      }

      const fanSongs = (fanSetlist.setlist_songs as any[])
        .sort((a: any, b: any) => b.votes - a.votes)
        .slice(0, 20) // Top 20 fan predictions
        .map((s: any) => s.songs?.name?.toLowerCase() || '');

      const playedSongs = (playedSetlist.played_setlist_songs as any[])
        .map((s: any) => s.songs?.name?.toLowerCase() || '');

      // Calculate matches
      const matches = fanSongs.filter(song => 
        playedSongs.some(played => 
          played.includes(song) || song.includes(played)
        )
      ).length;

      const accuracy = (matches / Math.max(fanSongs.length, 1)) * 100;

      return Math.round(accuracy);
    } catch (error) {
      console.error('Error calculating prediction accuracy:', error);
      return 0;
    }
  }
}

export const setlistImportServiceEnhanced = new SetlistImportServiceEnhanced();
