
import * as spotifyService from './spotify';
import * as ticketmasterService from './ticketmaster';
import { supabase } from '@/integrations/supabase/client';
import { CatalogImportManager } from './catalogImportManager';

export interface SyncJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: string;
}

export class BackgroundSyncManager {
  private jobs: SyncJob[] = [
    {
      id: 'trending-shows',
      name: 'Update Trending Shows',
      schedule: 'Every 6 hours',
      status: 'idle'
    },
    {
      id: 'artist-sync',
      name: 'Sync Artist Data',
      schedule: 'Daily',
      status: 'idle'
    },
    {
      id: 'catalog-updates',
      name: 'Update Song Catalogs',
      schedule: 'Weekly',
      status: 'idle'
    },
    {
      id: 'show-updates',
      name: 'Update Show Status',
      schedule: 'Every 4 hours',
      status: 'idle'
    }
  ];

  async syncTrendingShows(): Promise<void> {
    try {
      console.log('🔄 Starting trending shows sync...');
      
      // Fetch trending events from Ticketmaster
      const trendingEvents = await ticketmasterService.getTrendingEvents();
      console.log(`📊 Found ${trendingEvents.length} trending events`);

      let processedCount = 0;

      for (const event of trendingEvents) {
        try {
          // Process each event
          const processed = await this.processEvent(event);
          if (processed) {
            processedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing event ${event.id}:`, error);
        }
      }

      console.log(`✅ Processed ${processedCount}/${trendingEvents.length} trending events`);
    } catch (error) {
      console.error('❌ Error syncing trending shows:', error);
      throw error;
    }
  }

  async syncArtistData(): Promise<void> {
    try {
      console.log('🔄 Starting artist data sync...');

      // Get artists that need updates (haven't been synced in 7 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const { data: artists, error } = await supabase
        .from('artists')
        .select('id, name, last_synced_at')
        .or(`last_synced_at.is.null,last_synced_at.lt.${cutoffDate.toISOString()}`)
        .limit(20);

      if (error) {
        throw error;
      }

      console.log(`🎵 Found ${artists?.length || 0} artists to sync`);

      for (const artist of artists || []) {
        try {
          // Update artist metadata from Spotify
          const spotifyArtist = await spotifyService.getArtist(artist.id);
          
          if (spotifyArtist) {
            await supabase
              .from('artists')
              .update({
                name: spotifyArtist.name,
                image_url: spotifyArtist.images?.[0]?.url,
                popularity: spotifyArtist.popularity,
                genres: spotifyArtist.genres,
                spotify_url: spotifyArtist.external_urls?.spotify,
                last_synced_at: new Date().toISOString()
              })
              .eq('id', artist.id);

            console.log(`✅ Updated artist: ${artist.name}`);
          }
        } catch (error) {
          console.error(`❌ Error syncing artist ${artist.name}:`, error);
        }
      }

      console.log('✅ Artist data sync completed');
    } catch (error) {
      console.error('❌ Error syncing artist data:', error);
      throw error;
    }
  }

  async updateSongCatalogs(): Promise<void> {
    try {
      console.log('🔄 Starting song catalog updates...');

      // Get artists with upcoming shows that need catalog updates
      const { data: artistsWithShows, error } = await supabase
        .from('shows')
        .select(`
          artist_id,
          artists!shows_artist_id_fkey(id, name, last_synced_at)
        `)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(10);

      if (error) {
        throw error;
      }

      const uniqueArtists = new Map();
      artistsWithShows?.forEach(show => {
        if (show.artists && !uniqueArtists.has(show.artist_id)) {
          uniqueArtists.set(show.artist_id, show.artists);
        }
      });

      console.log(`🎵 Found ${uniqueArtists.size} artists with upcoming shows`);

      for (const [artistId, artist] of uniqueArtists) {
        try {
          // Check if artist has sufficient songs in catalog
          const { count: songCount } = await supabase
            .from('songs')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artistId);

          if (!songCount || songCount < 20) {
            console.log(`📥 Importing catalog for ${artist.name}...`);
            
            const catalogManager = new CatalogImportManager();
            const result = await catalogManager.importArtistCatalog(artistId);
            
            if (result.success) {
              console.log(`✅ Imported ${result.songsImported} songs for ${artist.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error updating catalog for ${artist.name}:`, error);
        }
      }

      console.log('✅ Song catalog updates completed');
    } catch (error) {
      console.error('❌ Error updating song catalogs:', error);
      throw error;
    }
  }

  async updateShowStatus(): Promise<void> {
    try {
      console.log('🔄 Starting show status updates...');

      // Get shows in the next 30 days
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const { data: shows, error } = await supabase
        .from('shows')
        .select('id, name, date')
        .gte('date', new Date().toISOString())
        .lte('date', futureDate.toISOString())
        .eq('status', 'scheduled')
        .limit(50);

      if (error) {
        throw error;
      }

      console.log(`🎪 Found ${shows?.length || 0} shows to check`);

      for (const show of shows || []) {
        try {
          // Check status with Ticketmaster
          const eventDetails = await ticketmasterService.getEventDetails(show.id);
          
          if (eventDetails && eventDetails.dates?.status?.code !== 'onsale') {
            // Update show status if changed
            let newStatus = 'scheduled';
            
            if (eventDetails.dates?.status?.code === 'cancelled') {
              newStatus = 'canceled';
            } else if (eventDetails.dates?.status?.code === 'postponed') {
              newStatus = 'postponed';
            }

            if (newStatus !== 'scheduled') {
              await supabase
                .from('shows')
                .update({ status: newStatus })
                .eq('id', show.id);

              console.log(`📅 Updated show ${show.name} status to ${newStatus}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error checking show ${show.name}:`, error);
        }
      }

      console.log('✅ Show status updates completed');
    } catch (error) {
      console.error('❌ Error updating show status:', error);
      throw error;
    }
  }

  private async processEvent(event: any): Promise<boolean> {
    try {
      // Extract artist name
      const artistName = event._embedded?.attractions?.[0]?.name;
      if (!artistName) return false;

      // Find or create artist
      const artist = await spotifyService.searchAndCreateArtist(artistName);
      if (!artist) return false;

      // Create venue
      const venue = event._embedded?.venues?.[0];
      if (venue) {
        await this.createVenue(venue);
      }

      // Create show
      await this.createShow(event, artist.id, venue?.id);

      return true;
    } catch (error) {
      console.error('Error processing event:', error);
      return false;
    }
  }

  private async createVenue(venueData: any): Promise<void> {
    const venue = {
      id: venueData.id,
      name: venueData.name,
      city: venueData.city?.name || '',
      state: venueData.state?.stateCode,
      country: venueData.country?.countryCode || 'US',
      address: venueData.address?.line1,
      latitude: venueData.location?.latitude ? parseFloat(venueData.location.latitude) : null,
      longitude: venueData.location?.longitude ? parseFloat(venueData.location.longitude) : null
    };

    await supabase
      .from('venues')
      .upsert(venue, { onConflict: 'id' });
  }

  private async createShow(eventData: any, artistId: string, venueId: string): Promise<void> {
    const show = {
      id: eventData.id,
      artist_id: artistId,
      venue_id: venueId,
      name: eventData.name,
      date: eventData.dates?.start?.date,
      start_time: eventData.dates?.start?.time,
      status: 'scheduled',
      ticketmaster_url: eventData.url,
      view_count: 0
    };

    await supabase
      .from('shows')
      .upsert(show, { onConflict: 'id' });
  }

  getJobs(): SyncJob[] {
    return this.jobs;
  }

  async runJob(jobId: string): Promise<void> {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.status = 'running';
    job.lastRun = new Date();

    try {
      switch (jobId) {
        case 'trending-shows':
          await this.syncTrendingShows();
          break;
        case 'artist-sync':
          await this.syncArtistData();
          break;
        case 'catalog-updates':
          await this.updateSongCatalogs();
          break;
        case 'show-updates':
          await this.updateShowStatus();
          break;
        default:
          throw new Error(`Unknown job: ${jobId}`);
      }

      job.status = 'completed';
      job.result = 'Success';
    } catch (error) {
      job.status = 'error';
      job.result = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();
