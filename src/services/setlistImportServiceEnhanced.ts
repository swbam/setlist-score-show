
import { supabase } from '@/integrations/supabase/client';
import { setlistfmService } from './setlistfm';
import { spotifyService } from './spotify';

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

      // Get show details from database
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          artists!inner(id, name),
          venues!inner(name, city, state, country)
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

      const artistName = show.artists.name;
      const showDate = new Date(show.date);
      const venueName = show.venues.name;
      const cityName = show.venues.city;

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
          const songId = await this.findOrCreateSong(show.artists.id, songName);

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

      // Search by artist and date
      const setlists = await setlistfmService.searchSetlists(artistName, formattedDate);

      if (!setlists || setlists.length === 0) {
        console.log('No setlists found for this date');
        return null;
      }

      // Try to find the best match by venue/city
      const bestMatch = setlists.find(setlist => {
        const venueMatch = setlist.venue?.name?.toLowerCase().includes(venueName.toLowerCase()) ||
                          venueName.toLowerCase().includes(setlist.venue?.name?.toLowerCase() || '');
        
        const cityMatch = setlist.venue?.city?.name?.toLowerCase() === cityName.toLowerCase();
        
        return venueMatch || cityMatch;
      });

      return bestMatch || setlists[0]; // Return best match or first result
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

      // Try fuzzy matching using the database function
      const { data: fuzzyMatches } = await supabase
        .rpc('match_song_similarity', {
          p_artist_id: artistId,
          p_song_name: songName,
          p_similarity_threshold: 0.7
        });

      if (fuzzyMatches && fuzzyMatches.length > 0) {
        return fuzzyMatches[0].id;
      }

      // If no match found, create a new song entry
      // This will be filled in later during catalog sync
      const { data: newSong } = await supabase
        .from('songs')
        .insert({
          id: `spotify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
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
      // Get fan-voted setlist
      const { data: fanSetlist } = await supabase
        .from('setlists')
        .select(`
          setlist_songs!inner(
            song_id,
            votes,
            songs!inner(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      // Get actual played setlist
      const { data: playedSetlist } = await supabase
        .from('played_setlists')
        .select(`
          played_setlist_songs!inner(
            song_id,
            position,
            songs!inner(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      if (!fanSetlist || !playedSetlist) {
        return 0;
      }

      const fanSongs = fanSetlist.setlist_songs
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 20) // Top 20 fan predictions
        .map(s => s.songs.name.toLowerCase());

      const playedSongs = playedSetlist.played_setlist_songs
        .map(s => s.songs.name.toLowerCase());

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

  /**
   * Import setlists for all shows from the past week
   */
  async importRecentSetlists(): Promise<void> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get shows from the past week that don't have played setlists
      const { data: recentShows } = await supabase
        .from('shows')
        .select(`
          id,
          date,
          artists!inner(name),
          venues!inner(name, city)
        `)
        .gte('date', oneWeekAgo.toISOString())
        .lte('date', new Date().toISOString());

      if (!recentShows || recentShows.length === 0) {
        console.log('No recent shows found');
        return;
      }

      console.log(`🎵 Processing ${recentShows.length} recent shows for setlist import`);

      // Process each show
      for (const show of recentShows) {
        try {
          const result = await this.importPlayedSetlistForShow(show.id);
          
          if (result.success) {
            console.log(`✅ Successfully imported setlist for ${show.artists.name}`);
            
            // Calculate and store prediction accuracy
            const accuracy = await this.calculatePredictionAccuracy(show.id);
            if (accuracy > 0) {
              console.log(`📊 Prediction accuracy for ${show.artists.name}: ${accuracy}%`);
            }
          } else {
            console.log(`❌ Failed to import setlist for ${show.artists.name}: ${result.message}`);
          }

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing show ${show.id}:`, error);
        }
      }

      console.log('✅ Completed recent setlist import process');
    } catch (error) {
      console.error('Error importing recent setlists:', error);
    }
  }
}

export const setlistImportServiceEnhanced = new SetlistImportServiceEnhanced();
