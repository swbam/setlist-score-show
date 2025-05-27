import { supabase } from '@/integrations/supabase/client';

export interface SetlistFmSong {
  name: string;
  artist?: {
    name: string;
  };
  cover?: {
    name: string;
    artist: {
      name: string;
    };
  };
}

export interface SetlistFmSet {
  song: SetlistFmSong[];
}

export interface SetlistFmData {
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
      country: {
        name: string;
      };
    };
  };
  sets: {
    set: SetlistFmSet[];
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  matchedSongs?: number;
  totalSongs?: number;
  accuracy?: number;
  playedSetlistId?: string;
}

export interface SongMatch {
  setlistSongId: string;
  playedSongName: string;
  matchScore: number;
  isExactMatch: boolean;
}

/**
 * Enhanced setlist.fm integration service for importing actual performed setlists
 */
export class SetlistImportServiceEnhanced {
  private static readonly SETLISTFM_API_KEY = import.meta.env.VITE_SETLISTFM_API_KEY;
  private static readonly SETLISTFM_BASE_URL = 'https://api.setlist.fm/rest/1.0';

  /**
   * Search for setlists by artist and date
   */
  static async searchSetlists(artistName: string, date: string, venueName?: string): Promise<SetlistFmData[]> {
    try {
      const searchParams = new URLSearchParams({
        artistName,
        date,
        ...(venueName && { venueName })
      });

      const response = await fetch(
        `${this.SETLISTFM_BASE_URL}/search/setlists?${searchParams}`,
        {
          headers: {
            'x-api-key': this.SETLISTFM_API_KEY,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Setlist.fm API error: ${response.status}`);
      }

      const data = await response.json();
      return data.setlist || [];
    } catch (error) {
      console.error('Error searching setlists:', error);
      return [];
    }
  }

  /**
   * Import a setlist from setlist.fm for a specific show
   */
  static async importSetlistForShow(showId: string): Promise<ImportResult> {
    try {
      // Get show details
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          artist:artists(name),
          venue:venues(name, city, country)
        `)
        .eq('id', showId)
        .single();

      if (showError || !show) {
        return {
          success: false,
          message: 'Show not found'
        };
      }

      // Check if already imported
      const { data: existingImport } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (existingImport) {
        return {
          success: false,
          message: 'Setlist already imported for this show'
        };
      }

      // Search for setlist on setlist.fm
      const showDate = new Date(show.date).toISOString().split('T')[0];
      const setlists = await this.searchSetlists(
        (show.artist as any)?.name || '',
        showDate,
        (show.venue as any)?.name
      );

      if (setlists.length === 0) {
        return {
          success: false,
          message: 'No setlist found on setlist.fm for this show'
        };
      }

      // Use the first matching setlist
      const setlistData = setlists[0];
      
      // Import the setlist
      const importResult = await this.importPlayedSetlist(showId, setlistData);
      
      if (importResult.success) {
        // Calculate accuracy against fan predictions
        const accuracy = await this.calculatePredictionAccuracy(showId, importResult.playedSetlistId!);
        
        return {
          ...importResult,
          accuracy
        };
      }

      return importResult;
    } catch (error) {
      console.error('Error importing setlist:', error);
      return {
        success: false,
        message: 'Failed to import setlist'
      };
    }
  }

  /**
   * Import played setlist data into database
   */
  private static async importPlayedSetlist(showId: string, setlistData: SetlistFmData): Promise<ImportResult> {
    try {
      // Create played setlist record
      const { data: playedSetlist, error: playedSetlistError } = await supabase
        .from('played_setlists')
        .insert({
          show_id: showId,
          setlist_fm_id: setlistData.id,
          played_date: new Date(setlistData.eventDate).toISOString()
        })
        .select()
        .single();

      if (playedSetlistError) {
        throw playedSetlistError;
      }

      // Extract songs from all sets
      const allSongs: SetlistFmSong[] = [];
      setlistData.sets.set.forEach(set => {
        allSongs.push(...set.song);
      });

      // Import songs
      let position = 1;
      let matchedSongs = 0;

      for (const song of allSongs) {
        const songName = song.cover ? song.cover.name : song.name;
        const artistName = song.cover ? song.cover.artist.name : setlistData.artist.name;

        // Try to find matching song in our database
        const matchedSongId = await this.findMatchingSong(songName, artistName);

        if (matchedSongId) {
          // Insert played setlist song
          await supabase
            .from('played_setlist_songs')
            .insert({
              played_setlist_id: playedSetlist.id,
              song_id: matchedSongId,
              position
            });

          matchedSongs++;
        } else {
          console.log(`Could not match song: ${songName} by ${artistName}`);
        }

        position++;
      }

      return {
        success: true,
        message: `Successfully imported setlist with ${matchedSongs}/${allSongs.length} matched songs`,
        matchedSongs,
        totalSongs: allSongs.length,
        playedSetlistId: playedSetlist.id
      };
    } catch (error) {
      console.error('Error importing played setlist:', error);
      return {
        success: false,
        message: 'Failed to import setlist data'
      };
    }
  }

  /**
   * Find matching song in database using fuzzy matching
   */
  private static async findMatchingSong(songName: string, artistName: string): Promise<string | null> {
    try {
      // First try exact match
      const { data: exactMatch } = await supabase
        .from('songs')
        .select('id')
        .ilike('name', songName)
        .in('artist_id', 
          supabase
            .from('artists')
            .select('id')
            .ilike('name', artistName)
        )
        .limit(1);

      if (exactMatch && exactMatch.length > 0) {
        return exactMatch[0].id;
      }

      // Try fuzzy matching using the database function
      const { data: fuzzyMatch } = await supabase
        .rpc('match_song_similarity', {
          song_name: songName,
          artist_name: artistName,
          threshold: 0.7
        });

      if (fuzzyMatch && fuzzyMatch.length > 0) {
        return fuzzyMatch[0].song_id;
      }

      return null;
    } catch (error) {
      console.error('Error finding matching song:', error);
      return null;
    }
  }

  /**
   * Calculate prediction accuracy by comparing fan votes with actual setlist
   */
  private static async calculatePredictionAccuracy(showId: string, playedSetlistId: string): Promise<number> {
    try {
      // Get fan-predicted setlist (top voted songs)
      const { data: fanPredictions } = await supabase
        .from('setlist_songs')
        .select('song_id, votes')
        .in('setlist_id',
          supabase
            .from('setlists')
            .select('id')
            .eq('show_id', showId)
        )
        .order('votes', { ascending: false });

      // Get actually played songs
      const { data: playedSongs } = await supabase
        .from('played_setlist_songs')
        .select('song_id')
        .eq('played_setlist_id', playedSetlistId);

      if (!fanPredictions || !playedSongs || playedSongs.length === 0) {
        return 0;
      }

      const playedSongIds = new Set(playedSongs.map(s => s.song_id));
      
      // Calculate how many of the top predicted songs were actually played
      const topPredictions = fanPredictions.slice(0, playedSongs.length);
      const correctPredictions = topPredictions.filter(p => playedSongIds.has(p.song_id));
      
      const accuracy = (correctPredictions.length / playedSongs.length) * 100;
      
      // Update show with accuracy score
      await supabase
        .from('shows')
        .update({ 
          prediction_accuracy: accuracy,
          setlist_imported: true 
        })
        .eq('id', showId);

      return accuracy;
    } catch (error) {
      console.error('Error calculating accuracy:', error);
      return 0;
    }
  }

  /**
   * Get setlist comparison data for display
   */
  static async getSetlistComparison(showId: string): Promise<{
    fanPredicted: Array<{ song: any; votes: number; rank: number }>;
    actuallyPlayed: Array<{ song: any; position: number }>;
    accuracy: number;
    totalVotes: number;
  } | null> {
    try {
      // Get fan predictions
      const { data: fanPredictions } = await supabase
        .from('setlist_songs')
        .select(`
          song_id,
          votes,
          song:songs(name, artist:artists(name))
        `)
        .in('setlist_id',
          supabase
            .from('setlists')
            .select('id')
            .eq('show_id', showId)
        )
        .order('votes', { ascending: false });

      // Get played setlist
      const { data: playedSetlist } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (!playedSetlist) {
        return null;
      }

      const { data: playedSongs } = await supabase
        .from('played_setlist_songs')
        .select(`
          song_id,
          position,
          song:songs(name, artist:artists(name))
        `)
        .eq('played_setlist_id', playedSetlist.id)
        .order('position');

      // Get show accuracy
      const { data: show } = await supabase
        .from('shows')
        .select('prediction_accuracy')
        .eq('id', showId)
        .single();

      const totalVotes = fanPredictions?.reduce((sum, p) => sum + p.votes, 0) || 0;

      return {
        fanPredicted: fanPredictions?.map((p, index) => ({
          song: p.song,
          votes: p.votes,
          rank: index + 1
        })) || [],
        actuallyPlayed: playedSongs?.map(p => ({
          song: p.song,
          position: p.position
        })) || [],
        accuracy: show?.prediction_accuracy || 0,
        totalVotes
      };
    } catch (error) {
      console.error('Error getting setlist comparison:', error);
      return null;
    }
  }

  /**
   * Auto-import setlists for shows that happened in the last 7 days
   */
  static async autoImportRecentSetlists(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get shows from the last 7 days that don't have imported setlists
      const { data: recentShows } = await supabase
        .from('shows')
        .select('id')
        .gte('date', sevenDaysAgo.toISOString())
        .lt('date', new Date().toISOString())
        .is('setlist_imported', null);

      if (!recentShows) return;

      console.log(`Auto-importing setlists for ${recentShows.length} recent shows`);

      for (const show of recentShows) {
        try {
          await this.importSetlistForShow(show.id);
          // Add delay to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to import setlist for show ${show.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in auto-import:', error);
    }
  }
}