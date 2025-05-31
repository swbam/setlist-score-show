
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import { SpotifyArtist } from "@/services/spotify";
import { Show } from "@/types/database";
import { toast } from "@/components/ui/sonner";

export function useArtistData(artistId: string | undefined) {
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [pastShows, setPastShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [setlistId, setSetlistId] = useState<string | null>(null);

  // Check if data is more than 7 days old
  function isDataStale(lastSyncedAt: string) {
    if (!lastSyncedAt) return true;
    
    const syncedDate = new Date(lastSyncedAt);
    const now = new Date();
    const diffDays = (now.getTime() - syncedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffDays > 7;
  }
  
  // Fetch shows for the artist with improved error handling
  async function fetchArtistShows(artistName: string) {
    try {
      console.log(`Fetching shows for artist: ${artistName}`);
      
      // First check database for shows with explicit relationship names
      const { data: dbShows, error: dbError } = await supabase
        .from('shows')
        .select(`
          *,
          venues!fk_shows_venue_id (
            name, 
            city, 
            state, 
            country
          )
        `)
        .eq('artist_id', artistId);
        
      if (dbError) {
        console.error("Error fetching shows from database:", dbError);
      }
      
      // If we have shows and the most recent show was updated in the last 24 hours, use db data
      if (dbShows && dbShows.length > 0) {
        console.log(`Found ${dbShows.length} shows in database for ${artistName}`);
        // Check if we should refresh from API
        // For now, we'll always return the database results and refresh in the background
        refreshShowsInBackground(artistName, artistId as string);
        return dbShows;
      }
      
      // Otherwise, fetch from Ticketmaster API and store results
      console.log(`No shows found in database for ${artistName}, fetching from API...`);
      return await fetchAndStoreShows(artistName, artistId as string);
    } catch (error) {
      console.error("Error fetching artist shows:", error);
      return [];
    }
  }
  
  // Fetch shows from API and store in database with improved error handling
  async function fetchAndStoreShows(artistName: string, artistId: string) {
    try {
      console.log(`Fetching and storing shows for ${artistName}`);
      const events = await ticketmasterService.getArtistEvents(artistName);
      const shows: Show[] = [];
      
      for (const event of events) {
        try {
          // Skip if no venue or date
          if (!event._embedded?.venues?.[0] || !event.dates?.start) {
            console.log(`Skipping event ${event.name} - missing venue or date`);
            continue;
          }
          
          const venue = event._embedded.venues[0];
          
          // Store venue in database with improved error handling
          const venueStored = await ticketmasterService.storeVenueInDatabase(venue);
          if (!venueStored) {
            console.error(`Failed to store venue for event ${event.name}, skipping`);
            continue;
          }
          
          // Store show in database with improved error handling
          const showStored = await ticketmasterService.storeShowInDatabase(event, artistId, venue.id);
          if (!showStored) {
            console.error(`Failed to store show ${event.name}, skipping`);
            continue;
          }
          
          // Add to results if successfully stored
          shows.push({
            id: event.id,
            artist_id: artistId,
            venue_id: venue.id,
            name: event.name,
            date: event.dates.start.dateTime || event.dates.start.localDate,
            start_time: event.dates.start.localTime || null,
            status: event.dates.status?.code === 'cancelled' ? 'canceled' : 
                   event.dates.status?.code === 'postponed' ? 'postponed' : 'scheduled',
            ticketmaster_url: event.url || null,
            venues: {
              name: venue.name,
              city: typeof venue.city === 'object' ? venue.city?.name : venue.city || '',
              state: typeof venue.state === 'object' ? venue.state?.name : venue.state || null,
              country: typeof venue.country === 'object' ? venue.country?.name : venue.country || ''
            }
          });
        } catch (eventError) {
          console.error(`Error processing event ${event.id}:`, eventError);
          continue;
        }
      }
      
      console.log(`Successfully processed ${shows.length} shows for ${artistName}`);
      return shows;
    } catch (error) {
      console.error(`Error fetching and storing shows for ${artistName}:`, error);
      return [];
    }
  }
  
  // Refresh shows in the background
  async function refreshShowsInBackground(artistName: string, artistId: string) {
    // Don't await this to prevent blocking the UI
    fetchAndStoreShows(artistName, artistId).catch(error => {
      console.error(`Background refresh failed for ${artistName}:`, error);
    });
  }

  // Fetch artist details and shows
  useEffect(() => {
    async function fetchArtistData() {
      if (!artistId) return;
      
      setLoading(true);
      
      try {
        console.log(`Fetching artist data for: ${artistId}`);
        
        // First try to get from database
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();
        
        let artistInfo: SpotifyArtist | null = null;
        
        if (artistError || !artistData || isDataStale(artistData.last_synced_at)) {
          console.log(`Fetching artist ${artistId} from Spotify API`);
          // Fetch from API if not found or stale
          artistInfo = await spotifyService.getArtist(artistId);
          
          if (artistInfo) {
            // Store in database
            await spotifyService.storeArtistInDatabase(artistInfo);
          }
        } else {
          console.log(`Using cached artist data for ${artistId}`);
          // Use database data
          artistInfo = {
            id: artistData.id,
            name: artistData.name,
            images: artistData.image_url ? [{ url: artistData.image_url, height: 300, width: 300 }] : [],
            popularity: artistData.popularity || 0,
            genres: artistData.genres || [],
            external_urls: { spotify: artistData.spotify_url || '' }
          };
        }
        
        if (artistInfo) {
          setArtist(artistInfo);
          
          // Get upcoming shows for this artist
          const artistShows = await fetchArtistShows(artistInfo.name);
          
          // Split into upcoming and past shows
          const now = new Date();
          const upcoming: Show[] = [];
          const past: Show[] = [];
          
          artistShows.forEach(show => {
            const showDate = new Date(show.date);
            if (showDate > now) {
              upcoming.push(show);
            } else {
              past.push(show);
            }
          });
          
          setUpcomingShows(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
          setPastShows(past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
          toast.error("Could not find artist information");
        }
      } catch (error) {
        console.error("Error fetching artist data:", error);
        toast.error("Failed to load artist information");
      } finally {
        setLoading(false);
      }
    }
    
    fetchArtistData();
  }, [artistId]);
  
  // Get the most recent setlist for this artist
  useEffect(() => {
    async function fetchRecentSetlist() {
      if (!artistId || upcomingShows.length === 0) return;
      
      try {
        // Get the most recent setlist for this artist
        const { data } = await supabase
          .from('setlists')
          .select('id')
          .eq('show_id', upcomingShows[0]?.id)
          .limit(1)
          .maybeSingle();
          
        if (data) {
          setSetlistId(data.id);
        }
      } catch (error) {
        console.error("Error fetching recent setlist:", error);
      }
    }
    
    fetchRecentSetlist();
  }, [artistId, upcomingShows]);

  return {
    artist,
    upcomingShows,
    pastShows,
    loading,
    setlistId
  };
}
