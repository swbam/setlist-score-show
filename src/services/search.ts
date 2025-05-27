import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "./ticketmaster";
import * as spotifyService from "./spotify";
import * as dataConsistency from "./dataConsistency";

export interface SearchArtist {
  id: string;
  name: string;
  image_url?: string;
  popularity?: number;
  upcomingShowsCount?: number;
  nextShow?: {
    id: string;
    date: string;
    venue: string;
    city: string;
  };
}

export interface SearchShow {
  id: string;
  name: string;
  date: string;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
  };
  vote_count?: number;
  view_count: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'artist' | 'show';
  image_url?: string;
  date?: string;
  venue?: string;
  city?: string;
  artist?: {
    id: string;
    name: string;
  };
}

/**
 * Enhanced search that ensures complete data flow from search to voting
 */
export async function searchArtistsAndShows(query: string): Promise<{
  artists: SearchArtist[];
  shows: SearchShow[];
}> {
  try {
    console.log(`🔍 Starting enhanced search for: "${query}"`);

    if (!query || query.trim().length < 2) {
      return { artists: [], shows: [] };
    }

    // Step 1: Search database first for existing data
    const [dbArtists, dbShows] = await Promise.all([
      searchDatabaseArtists(query),
      searchDatabaseShows(query)
    ]);

    console.log(`📊 Database search found: ${dbArtists.length} artists, ${dbShows.length} shows`);

    // Step 2: Search external APIs and import new data
    await searchAndImportFromAPIs(query);

    // Step 3: Search database again for newly imported data
    const [finalArtists, finalShows] = await Promise.all([
      searchDatabaseArtists(query),
      searchDatabaseShows(query)
    ]);

    console.log(`✅ Final search results: ${finalArtists.length} artists, ${finalShows.length} shows`);

    return {
      artists: finalArtists,
      shows: finalShows
    };
  } catch (error) {
    console.error("❌ Error in searchArtistsAndShows:", error);
    return { artists: [], shows: [] };
  }
}

/**
 * Search for artists in the database
 */
async function searchDatabaseArtists(query: string): Promise<SearchArtist[]> {
  try {
    const { data: artists, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!shows_artist_id_fkey(
          id,
          date,
          venues!shows_venue_id_fkey(name, city)
        )
      `)
      .ilike('name', `%${query}%`)
      .order('popularity', { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error searching database artists:", error);
      return [];
    }

    return (artists || []).map(artist => {
      const shows = (artist.shows as any[]) || [];
      const upcomingShows = shows.filter(show => 
        new Date(show.date) >= new Date()
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const nextShow = upcomingShows[0];
      const venue = nextShow?.venues as any;

      return {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url,
        popularity: artist.popularity,
        upcomingShowsCount: upcomingShows.length,
        nextShow: nextShow ? {
          id: nextShow.id,
          date: nextShow.date,
          venue: venue?.name || 'Unknown Venue',
          city: venue?.city || ''
        } : undefined
      };
    });
  } catch (error) {
    console.error("❌ Error in searchDatabaseArtists:", error);
    return [];
  }
}

/**
 * Search for shows in the database
 */
async function searchDatabaseShows(query: string): Promise<SearchShow[]> {
  try {
    const { data: shows, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artists!shows_artist_id_fkey(id, name, image_url),
        venues!shows_venue_id_fkey(id, name, city, state, country)
      `)
      .or(`name.ilike.%${query}%,artists.name.ilike.%${query}%`)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(20);

    if (error) {
      console.error("❌ Error searching database shows:", error);
      return [];
    }

    return (shows || []).map(show => {
      const artistData = show.artists as any;
      const venueData = show.venues as any;

      return {
        id: show.id,
        name: show.name || `${artistData?.name || 'Unknown Artist'} Concert`,
        date: show.date,
        artist: {
          id: artistData?.id || '',
          name: artistData?.name || 'Unknown Artist',
          image_url: artistData?.image_url
        },
        venue: {
          id: venueData?.id || '',
          name: venueData?.name || 'Unknown Venue',
          city: venueData?.city || '',
          state: venueData?.state,
          country: venueData?.country || ''
        },
        view_count: show.view_count || 0
      };
    });
  } catch (error) {
    console.error("❌ Error in searchDatabaseShows:", error);
    return [];
  }
}

/**
 * Search external APIs and import new data
 */
async function searchAndImportFromAPIs(query: string): Promise<void> {
  try {
    console.log(`🌐 Searching external APIs for: "${query}"`);

    // Search Ticketmaster for events and import complete data
    const ticketmasterEvents = await ticketmasterService.searchEvents(query, 10);
    
    if (ticketmasterEvents.length > 0) {
      console.log(`🎫 Found ${ticketmasterEvents.length} Ticketmaster events`);
      
      // Process each event through the data consistency layer
      for (const event of ticketmasterEvents) {
        try {
          await dataConsistency.processTicketmasterEvent(event);
          
          // Ensure artist has song catalog
          if (event._embedded?.attractions?.[0]) {
            const attraction = event._embedded.attractions[0];
            const ensuredArtist = await dataConsistency.ensureArtistExists({
              id: attraction.id,
              name: attraction.name
            });

            if (ensuredArtist) {
              // Check if artist has songs
              const { count: songCount } = await supabase
                .from('songs')
                .select('id', { count: 'exact' })
                .eq('artist_id', ensuredArtist.id);

              if (!songCount || songCount === 0) {
                console.log(`📀 Importing song catalog for ${ensuredArtist.name}...`);
                await spotifyService.importArtistCatalog(ensuredArtist.id);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error processing event ${event.id}:`, error);
        }
      }
    }

    // Add small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error("❌ Error in searchAndImportFromAPIs:", error);
  }
}

/**
 * Get trending artists with upcoming shows
 */
export async function getTrendingArtists(limit: number = 10): Promise<SearchArtist[]> {
  try {
    const { data: artists, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!shows_artist_id_fkey(
          id,
          date,
          view_count,
          venues!shows_venue_id_fkey(name, city)
        )
      `)
      .order('popularity', { ascending: false })
      .limit(limit * 2);

    if (error) {
      console.error("❌ Error getting trending artists:", error);
      return [];
    }

    // Filter artists with upcoming shows and calculate trending score
    const trendingArtists = (artists || [])
      .map(artist => {
        const shows = (artist.shows as any[]) || [];
        const upcomingShows = shows.filter(show => 
          new Date(show.date) >= new Date()
        );

        if (upcomingShows.length === 0) return null;

        const totalViews = upcomingShows.reduce((sum, show) => sum + (show.view_count || 0), 0);
        const trendingScore = (artist.popularity || 0) + (totalViews * 2) + (upcomingShows.length * 5);

        const nextShow = upcomingShows.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0];
        
        const venue = nextShow?.venues as any;

        return {
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
          popularity: trendingScore,
          upcomingShowsCount: upcomingShows.length,
          nextShow: {
            id: nextShow.id,
            date: nextShow.date,
            venue: venue?.name || 'Unknown Venue',
            city: venue?.city || ''
          }
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.popularity || 0) - (a!.popularity || 0))
      .slice(0, limit);

    return trendingArtists as SearchArtist[];
  } catch (error) {
    console.error("❌ Error in getTrendingArtists:", error);
    return [];
  }
}

/**
 * Unified search function that returns mixed artist and show results
 * Compatible with UserFlowTest component expectations
 */
export async function search({ query, limit = 10 }: { query: string; limit?: number }): Promise<SearchResult[]> {
  try {
    const { artists, shows } = await searchArtistsAndShows(query);
    
    const results: SearchResult[] = [];
    
    // Add artists to results
    artists.slice(0, Math.ceil(limit / 2)).forEach(artist => {
      results.push({
        id: artist.id,
        name: artist.name,
        type: 'artist' as const,
        image_url: artist.image_url
      });
    });
    
    // Add shows to results
    shows.slice(0, Math.floor(limit / 2)).forEach(show => {
      results.push({
        id: show.id,
        name: show.name,
        type: 'show' as const,
        date: show.date,
        venue: show.venue.name,
        city: show.venue.city,
        artist: {
          id: show.artist.id,
          name: show.artist.name
        }
      });
    });
    
    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Error in unified search:", error);
    return [];
  }
}
