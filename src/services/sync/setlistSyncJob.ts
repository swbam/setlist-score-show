import { supabase } from '@/integrations/supabase/client';
import pLimit from 'p-limit';

interface SetlistFmArtist {
  mbid: string;
  name: string;
}

interface SetlistFmVenue {
  id: string;
  name: string;
  city: {
    name: string;
    state?: string;
    country: {
      name: string;
      code: string;
    };
    coords?: {
      lat: number;
      long: number;
    };
  };
}

interface SetlistFmSetlist {
  id: string;
  eventDate: string;
  artist: SetlistFmArtist;
  venue: SetlistFmVenue;
  tour?: { name: string };
  sets: {
    set: Array<{
      song: Array<{
        name: string;
        info?: string;
      }>;
    }>;
  };
}

export class SetlistSyncJob {
  private limit = pLimit(3); // Max 3 concurrent API calls
  
  async syncYesterdaysShows() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log(`[SetlistSync] Starting sync for ${dateStr}`);
    
    // Get all tracked artists
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, setlistfm_mbid')
      .not('setlistfm_mbid', 'is', null);

    if (artistsError || !artists) {
      console.error('[SetlistSync] Error fetching artists:', artistsError);
      return;
    }

    // Sync each artist's shows
    const results = await Promise.allSettled(
      artists.map((artist) => 
        this.limit(() => this.syncArtistShows(artist, dateStr))
      )
    );

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[SetlistSync] Sync complete: ${successful} successful, ${failed} failed`);
    
    // Log sync history
    await supabase.from('sync_history').insert({
      sync_type: 'setlistfm',
      entity_type: 'setlist',
      status: 'completed',
      items_processed: successful,
      completed_at: new Date().toISOString()
    });
  }

  private async syncArtistShows(artist: any, date: string) {
    try {
      console.log(`[SetlistSync] Syncing shows for ${artist.name} on ${date}`);
      
      // Here you would call the actual Setlist.fm API
      // For now, this is a placeholder that demonstrates the structure
      const setlists: SetlistFmSetlist[] = []; // await this.setlistFmClient.getArtistSetlists(artist.setlistfm_mbid, date);

      for (const setlist of setlists) {
        await this.processSetlist(artist, setlist);
      }
      
      console.log(`[SetlistSync] Synced ${setlists.length} setlists for ${artist.name}`);
    } catch (error) {
      console.error(`[SetlistSync] Failed to sync artist ${artist.name}:`, error);
      
      await supabase.from('sync_history').insert({
        sync_type: 'setlistfm',
        entity_type: 'artist',
        entity_id: artist.id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  private async processSetlist(artist: any, setlist: SetlistFmSetlist) {
    try {
      // Upsert venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .upsert({
          setlistfm_id: setlist.venue.id,
          name: setlist.venue.name,
          city: setlist.venue.city.name,
          state: setlist.venue.city.state,
          country: setlist.venue.city.country.name,
          latitude: setlist.venue.city.coords?.lat,
          longitude: setlist.venue.city.coords?.long
        }, {
          onConflict: 'setlistfm_id'
        })
        .select()
        .single();

      if (venueError || !venue) {
        throw new Error(`Failed to upsert venue: ${venueError?.message}`);
      }

      // Create show
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert({
          artist_id: artist.id,
          venue_id: venue.id,
          setlistfm_id: setlist.id,
          date: setlist.eventDate,
          name: setlist.tour?.name || `${artist.name} at ${venue.name}`,
          tour_name: setlist.tour?.name,
          status: 'completed'
        })
        .select()
        .single();

      if (showError || !show) {
        throw new Error(`Failed to create show: ${showError?.message}`);
      }

      // Create setlist and songs
      const { data: newSetlist, error: setlistError } = await supabase
        .from('setlists')
        .insert({
          show_id: show.id,
          name: 'Main Set',
          order_index: 0
        })
        .select()
        .single();

      if (setlistError || !newSetlist) {
        throw new Error(`Failed to create setlist: ${setlistError?.message}`);
      }

      // Process songs
      let position = 1;
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          await this.processSong(artist, newSetlist.id, song.name, position++);
        }
      }

      // Log sync
      await supabase.from('sync_history').insert({
        sync_type: 'setlistfm',
        entity_type: 'setlist',
        entity_id: show.id,
        external_id: setlist.id,
        status: 'completed',
        items_processed: position - 1
      });

    } catch (error) {
      console.error(`[SetlistSync] Error processing setlist:`, error);
      throw error;
    }
  }

  private async processSong(artist: any, setlistId: string, songName: string, position: number) {
    try {
      // Try to match with existing song
      const { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('artist_id', artist.id)
        .ilike('name', songName)
        .single();

      let songId: string;

      if (existingSong) {
        songId = existingSong.id;
      } else {
        // Create new song if not found
        const { data: newSong, error: songError } = await supabase
          .from('songs')
          .insert({
            artist_id: artist.id,
            name: songName,
            album: 'Unknown',
            duration_ms: 0,
            spotify_url: ''
          })
          .select()
          .single();

        if (songError || !newSong) {
          throw new Error(`Failed to create song: ${songError?.message}`);
        }

        songId = newSong.id;
      }

      // Add to setlist
      await supabase
        .from('setlist_songs')
        .insert({
          setlist_id: setlistId,
          song_id: songId,
          position: position,
          votes: 0
        });

    } catch (error) {
      console.error(`[SetlistSync] Error processing song ${songName}:`, error);
    }
  }

  // Sync upcoming shows from Ticketmaster
  async syncUpcomingShows() {
    console.log('[SetlistSync] Starting upcoming shows sync from Ticketmaster');
    
    try {
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, ticketmaster_id')
        .not('ticketmaster_id', 'is', null);

      if (!artists) return;

      for (const artist of artists) {
        // Here you would call Ticketmaster API
        // This is a placeholder implementation
        console.log(`[SetlistSync] Would sync upcoming shows for ${artist.name}`);
      }
      
    } catch (error) {
      console.error('[SetlistSync] Error syncing upcoming shows:', error);
    }
  }

  // Sync song catalogs from Spotify
  async syncArtistCatalogs() {
    console.log('[SetlistSync] Starting artist catalog sync from Spotify');
    
    try {
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, spotify_id')
        .not('spotify_id', 'is', null);

      if (!artists) return;

      const results = await Promise.allSettled(
        artists.map((artist) => 
          this.limit(() => this.syncArtistCatalog(artist))
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[SetlistSync] Catalog sync complete: ${successful}/${artists.length} successful`);
      
    } catch (error) {
      console.error('[SetlistSync] Error syncing artist catalogs:', error);
    }
  }

  private async syncArtistCatalog(artist: any) {
    try {
      console.log(`[SetlistSync] Syncing catalog for ${artist.name}`);
      
      // Here you would call Spotify API to get artist's top tracks and albums
      // This is a placeholder
      
      // Update last_synced_at
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artist.id);
        
    } catch (error) {
      console.error(`[SetlistSync] Error syncing catalog for ${artist.name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const setlistSyncJob = new SetlistSyncJob();