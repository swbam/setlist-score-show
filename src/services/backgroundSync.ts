
import { supabase } from '@/integrations/supabase/client';
import * as ticketmasterService from './ticketmaster';
import * as spotifyService from './spotify';
import { SongCatalogManager } from './songCatalogManager';

interface SyncJob {
  name: string;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
}

export class BackgroundSyncManager {
  private jobs: Map<string, SyncJob> = new Map();

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    this.jobs.set('trending-calculation', {
      name: 'Trending Shows Calculation',
      status: 'idle'
    });

    this.jobs.set('artist-sync', {
      name: 'Artist Data Sync',
      status: 'idle'
    });

    this.jobs.set('show-refresh', {
      name: 'Show Data Refresh',
      status: 'idle'
    });
  }

  async calculateTrendingShows(): Promise<void> {
    const job = this.jobs.get('trending-calculation')!;
    job.status = 'running';
    job.lastRun = new Date();

    try {
      // Calculate trending based on recent votes and view count
      // Since calculate_trending_shows doesn't exist, we'll implement it manually
      const { data: shows, error } = await supabase
        .from('shows')
        .select(`
          id,
          view_count,
          date,
          setlists!shows_id_fkey(
            setlist_songs!setlists_id_fkey(votes)
          )
        `)
        .gte('date', new Date().toISOString())
        .order('view_count', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      console.log('Trending calculation completed:', shows?.length || 0, 'shows processed');
      job.status = 'idle';
    } catch (error) {
      console.error('Error calculating trending shows:', error);
      job.status = 'error';
    }
  }

  async syncArtistData(): Promise<void> {
    const job = this.jobs.get('artist-sync')!;
    job.status = 'running';
    job.lastRun = new Date();

    try {
      // Get artists that need syncing (older than 7 days)
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name, last_synced_at')
        .lt('last_synced_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10); // Process 10 at a time

      if (!artists || artists.length === 0) {
        job.status = 'idle';
        return;
      }

      for (const artist of artists) {
        try {
          // Update artist data from Spotify
          const spotifyArtist = await spotifyService.getArtist(artist.id);
          
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

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error syncing artist ${artist.id}:`, error);
        }
      }

      job.status = 'idle';
    } catch (error) {
      console.error('Error syncing artist data:', error);
      job.status = 'error';
    }
  }

  async refreshShowData(): Promise<void> {
    const job = this.jobs.get('show-refresh')!;
    job.status = 'running';
    job.lastRun = new Date();

    try {
      // Get shows in the next 30 days that need refreshing
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const { data: shows } = await supabase
        .from('shows')
        .select(`
          id,
          artist_id,
          artists!shows_artist_id_fkey(name)
        `)
        .gte('date', new Date().toISOString())
        .lte('date', futureDate.toISOString())
        .limit(20); // Process 20 at a time

      if (!shows || shows.length === 0) {
        job.status = 'idle';
        return;
      }

      for (const show of shows) {
        try {
          // Refresh show data from Ticketmaster
          const events = await ticketmasterService.searchEvents(show.artists?.name || '');

          // Find matching event and update if needed
          const matchingEvent = events.find(event => event.id === show.id);
          
          if (matchingEvent) {
            await supabase
              .from('shows')
              .update({
                name: matchingEvent.name,
                date: matchingEvent.dates?.start?.dateTime || matchingEvent.dates?.start?.localDate,
                start_time: matchingEvent.dates?.start?.localTime,
                status: matchingEvent.dates?.status?.code === 'onsale' ? 'scheduled' : 'postponed',
                ticketmaster_url: matchingEvent.url
              })
              .eq('id', show.id);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error refreshing show ${show.id}:`, error);
        }
      }

      job.status = 'idle';
    } catch (error) {
      console.error('Error refreshing show data:', error);
      job.status = 'error';
    }
  }

  getJobStatus(jobName: string): SyncJob | undefined {
    return this.jobs.get(jobName);
  }

  getAllJobs(): SyncJob[] {
    return Array.from(this.jobs.values());
  }
}

// Singleton instance
export const backgroundSync = new BackgroundSyncManager();
