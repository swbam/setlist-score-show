import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SetlistFmSetlist {
  id: string;
  artist: { name: string };
  venue: { 
    name: string; 
    city: { 
      name: string; 
      country: { 
        name: string;
        code: string;
      } 
    } 
  };
  eventDate: string;
  sets: {
    set: Array<{
      name?: string;
      encore?: number;
      song: Array<{
        name: string;
        tape?: boolean;
        info?: string;
      }>;
    }>;
  };
}

export class SetlistFmImporter {
  private apiKey = 'xkutflW-aRy_Df9rF4OkJyCsHBYN88V37EBL';
  private baseUrl = 'https://api.setlist.fm/rest/1.0';
  
  async importShowSetlist(showId: string): Promise<void> {
    console.log(`Starting setlist import for show ${showId}`);
    
    // Get show details
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select(`
        *,
        artists(*),
        venues(*)
      `)
      .eq('id', showId)
      .single();
    
    if (showError || !show) {
      throw new Error(`Show not found: ${showId}`);
    }
    
    // Search for setlist
    const setlist = await this.searchSetlist(
      show.artists.name,
      show.venues.name,
      new Date(show.date)
    );
    
    if (!setlist) {
      console.log('No setlist found for show');
      return;
    }
    
    // Check if already imported
    const { data: existing } = await supabase
      .from('played_setlists')
      .select('id')
      .eq('setlist_fm_id', setlist.id)
      .single();
    
    if (existing) {
      console.log('Setlist already imported');
      return;
    }
    
    // Create played setlist record
    const { data: playedSetlist, error: insertError } = await supabase
      .from('played_setlists')
      .insert({
        show_id: showId,
        setlist_fm_id: setlist.id,
        played_date: show.date,
        imported_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create played setlist: ${insertError.message}`);
    }
    
    // Process songs
    const allSongs = this.extractSongs(setlist);
    console.log(`Found ${allSongs.length} songs to import`);
    
    for (let position = 0; position < allSongs.length; position++) {
      const songName = allSongs[position];
      
      // Try to match with existing song or create new
      const songId = await this.matchOrCreateSong(
        show.artists.id,
        songName
      );
      
      if (songId) {
        const { error } = await supabase
          .from('played_setlist_songs')
          .insert({
            played_setlist_id: playedSetlist.id,
            song_id: songId,
            position: position + 1
          });
          
        if (error) {
          console.error(`Failed to insert song at position ${position + 1}:`, error);
        }
      }
    }
    
    // Calculate accuracy scores
    await this.calculateAccuracy(showId, playedSetlist.id);
    
    console.log('Setlist import completed successfully');
  }
  
  private async searchSetlist(
    artistName: string,
    venueName: string,
    date: Date
  ): Promise<SetlistFmSetlist | null> {
    const dateStr = format(date, 'dd-MM-yyyy');
    
    try {
      // First try exact match with venue
      let url = `${this.baseUrl}/search/setlists?` +
        `artistName=${encodeURIComponent(artistName)}&` +
        `venueName=${encodeURIComponent(venueName)}&` +
        `date=${dateStr}`;
      
      let response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        console.error('Setlist.fm API error:', response.status);
        return null;
      }
      
      let data = await response.json();
      
      if (data.setlist && data.setlist.length > 0) {
        return data.setlist[0];
      }
      
      // Try without venue name
      url = `${this.baseUrl}/search/setlists?` +
        `artistName=${encodeURIComponent(artistName)}&` +
        `date=${dateStr}`;
      
      response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        return null;
      }
      
      data = await response.json();
      
      if (data.setlist && data.setlist.length > 0) {
        // Try to match venue
        for (const setlist of data.setlist) {
          if (this.venueMatches(venueName, setlist.venue.name)) {
            return setlist;
          }
        }
        // Return first one if no venue match
        return data.setlist[0];
      }
      
      return null;
    } catch (error) {
      console.error('Failed to search setlist:', error);
      return null;
    }
  }
  
  private venueMatches(venueName1: string, venueName2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalize(venueName1).includes(normalize(venueName2)) ||
           normalize(venueName2).includes(normalize(venueName1));
  }
  
  private extractSongs(setlist: SetlistFmSetlist): string[] {
    const songs: string[] = [];
    
    if (!setlist.sets?.set) {
      return songs;
    }
    
    for (const set of setlist.sets.set) {
      if (!set.song) continue;
      
      for (const song of set.song) {
        if (!song.tape) { // Exclude tape/playback songs
          songs.push(song.name);
        }
      }
    }
    
    return songs;
  }
  
  private async matchOrCreateSong(artistId: string, songName: string): Promise<string | null> {
    // First try exact match
    const { data: exactMatch } = await supabase
      .from('songs')
      .select('id')
      .eq('artist_id', artistId)
      .ilike('name', songName)
      .single();
    
    if (exactMatch) {
      return exactMatch.id;
    }
    
    // Try fuzzy match using the database function
    const { data: fuzzyMatch } = await supabase.rpc('match_song_similarity', {
      p_artist_id: artistId,
      p_song_name: songName,
      p_similarity_threshold: 0.7
    });
    
    if (fuzzyMatch && fuzzyMatch.length > 0) {
      return fuzzyMatch[0].id;
    }
    
    // Create new song if no match
    const { data: newSong, error } = await supabase
      .from('songs')
      .insert({
        artist_id: artistId,
        name: songName,
        source: 'setlistfm'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create song:', error);
      return null;
    }
    
    return newSong.id;
  }
  
  private async calculateAccuracy(showId: string, playedSetlistId: string): Promise<void> {
    // Get voted setlist
    const { data: setlist } = await supabase
      .from('setlists')
      .select('id')
      .eq('show_id', showId)
      .single();
      
    if (!setlist) {
      console.log('No voted setlist found for accuracy calculation');
      return;
    }
    
    // Get voted songs (top 20 by votes)
    const { data: votedSongs } = await supabase
      .from('setlist_songs')
      .select('song_id, position')
      .eq('setlist_id', setlist.id)
      .order('votes', { ascending: false })
      .limit(20);
    
    // Get actual played songs
    const { data: actualSongs } = await supabase
      .from('played_setlist_songs')
      .select('song_id, position')
      .eq('played_setlist_id', playedSetlistId)
      .order('position');
    
    if (!votedSongs || !actualSongs) {
      return;
    }
    
    // Calculate accuracy metrics
    const votedIds = new Set(votedSongs.map(s => s.song_id));
    const actualIds = new Set(actualSongs.map(s => s.song_id));
    
    const correctPredictions = [...votedIds].filter(id => actualIds.has(id)).length;
    const accuracy = correctPredictions / Math.max(votedIds.size, actualIds.size);
    
    // Calculate position accuracy for matching songs
    let positionScore = 0;
    let matchedSongs = 0;
    
    for (const voted of votedSongs) {
      const actual = actualSongs.find(s => s.song_id === voted.song_id);
      if (actual) {
        matchedSongs++;
        // Score based on how close the positions are
        const positionDiff = Math.abs(voted.position - actual.position);
        const maxDiff = Math.max(votedSongs.length, actualSongs.length);
        positionScore += 1 - (positionDiff / maxDiff);
      }
    }
    
    const avgPositionAccuracy = matchedSongs > 0 ? positionScore / matchedSongs : 0;
    
    // Update show with accuracy metrics
    await supabase
      .from('shows')
      .update({ 
        prediction_accuracy: accuracy,
        position_accuracy: avgPositionAccuracy,
        correct_predictions: correctPredictions,
        total_predictions: votedIds.size
      })
      .eq('id', showId);
    
    console.log(`Accuracy calculated: ${(accuracy * 100).toFixed(1)}% songs correct`);
  }
}

// Export singleton instance
export const setlistFmImporter = new SetlistFmImporter();