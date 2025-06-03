import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "./ticketmaster";
import * as spotifyService from "./spotify";
import * as dataConsistency from "./dataConsistencyFixed";
import { Show, Artist, Venue } from "@/types/database";

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
  voteCount?: number;
  view_count?: number;
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
 * Enhanced search that follows the data-flow.md architecture
 * 1. Always search Ticketmaster API for real-time show availability
 * 2. Import artists and shows as needed
 * 3. Return combined results from database
 */
export async function searchArtistsAndShows(query: string): Promise<{
  artists: SearchArtist[];
  shows: SearchShow[];
}> {
  try {
    console.log(`🔍 Starting search for: "${query}"`);

    if (!query || query.trim().length < 2) {
      return { artists: [], shows: [] };
    }

    // Step 1: Search Ticketmaster API directly for real-time data
    console.log(`🎫 Searching Ticketmaster API for: "${query}"`);
    const ticketmasterEvents = await ticketmasterService.searchEvents(query, 20);
    
    if (ticketmasterEvents.length > 0) {
      console.log(`📊 Found ${ticketmasterEvents.length} events from Ticketmaster`);
      
      // Process each event and import data as needed
      const processedArtists = new Set<string>();
      
      for (const event of ticketmasterEvents) {
        try {
          // Process the event through data consistency layer
          const result = await dataConsistency.processTicketmasterEvent(event);
          
          if (result.artist && !processedArtists.has(result.artist.id)) {
            processedArtists.add(result.artist.id);
            
            // Check if artist needs song catalog import
            const { count: songCount } = await supabase
              .from('songs')
              .select('id', { count: 'exact' })
              .eq('artist_id', result.artist.id);

            if (!songCount || songCount === 0) {
              console.log(`📀 Importing song catalog for ${result.artist.name}...`);
              await spotifyService.importArtistCatalog(result.artist.id);
            }
          }
        } catch (error) {
          console.error(`⚠️ Error processing event:`, error);
        }
      }
    }

    // Step 2: Query database for final results (now includes imported data)
    const [artists, shows] = await Promise.all([
      searchDatabaseArtists(query),
      searchDatabaseShows(query)
    ]);

    console.log(`✅ Search complete: ${artists.length} artists, ${shows.length} shows`);

    return {
      artists,
      shows
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
      const shows = (artist.shows as Show[]) || [];
      const upcomingShows = shows.filter(show => 
        new Date(show.date) >= new Date()
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const nextShow = upcomingShows[0];
      const venue = nextShow?.venues as Venue;

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
      .or(`name.ilike.%${query}%`)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(20);

    if (error) {
      console.error("❌ Error searching database shows:", error);
      return [];
    }

    return (shows || []).map(show => {
      const artistData = show.artists as Artist;
      const venueData = show.venues as Venue;

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
        const shows = (artist.shows as Show[]) || [];
        const upcomingShows = shows.filter(show => 
          new Date(show.date) >= new Date()
        );

        if (upcomingShows.length === 0) return null;

        const totalViews = upcomingShows.reduce((sum, show) => sum + (show.view_count || 0), 0);
        const trendingScore = (artist.popularity || 0) + (totalViews * 2) + (upcomingShows.length * 5);

        const nextShow = upcomingShows.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )[0];
        
        const venue = nextShow?.venues as Venue;

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

/**
 * Advanced search with filters, sorting, and enhanced results
 */
export async function advancedSearch({
  query,
  filters = {},
  sortBy = 'relevance',
  limit = 20,
  offset = 0
}: {
  query: string;
  filters?: {
    location?: string;
    dateRange?: string;
    genre?: string;
    artistType?: string;
    hasUpcomingShows?: boolean;
  };
  sortBy?: 'relevance' | 'popularity' | 'date' | 'votes' | 'alphabetical';
  limit?: number;
  offset?: number;
}): Promise<{
  artists: SearchArtist[];
  shows: SearchShow[];
  total: number;
  hasMore: boolean;
}> {
  try {
    console.log(`🔍 Advanced search for: "${query}" with filters:`, filters);

    if (!query || query.trim().length < 2) {
      return { artists: [], shows: [], total: 0, hasMore: false };
    }

    const searchTerm = query.trim();
    let artistQuery = supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        genres,
        upcoming_shows:shows!shows_artist_id_fkey(count)
      `)
      .ilike('name', `%${searchTerm}%`);

    let showQuery = supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artists!shows_artist_id_fkey(id, name, image_url),
        venues!shows_venue_id_fkey(id, name, city, state, country),
        setlists(
          setlist_songs(votes)
        )
      `)
      .or(`name.ilike.%${searchTerm}%,artists.name.ilike.%${searchTerm}%,venues.name.ilike.%${searchTerm}%`);

    // Apply filters
    if (filters.location) {
      showQuery = showQuery.or(
        `venues.city.ilike.%${filters.location}%,venues.state.ilike.%${filters.location}%,venues.country.ilike.%${filters.location}%`
      );
    }

    if (filters.genre) {
      artistQuery = artistQuery.contains('genres', [filters.genre]);
    }

    if (filters.hasUpcomingShows) {
      artistQuery = artistQuery.gte('upcoming_shows', 1);
    }

    if (filters.dateRange) {
      const { start, end } = getDateRangeValues(filters.dateRange);
      if (start) showQuery = showQuery.gte('date', start);
      if (end) showQuery = showQuery.lte('date', end);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        artistQuery = artistQuery.order('popularity', { ascending: false });
        showQuery = showQuery.order('view_count', { ascending: false });
        break;
      case 'date':
        showQuery = showQuery.order('date', { ascending: true });
        break;
      case 'votes':
        // For now, order by view_count as a proxy for engagement
        showQuery = showQuery.order('view_count', { ascending: false });
        break;
      case 'alphabetical':
        artistQuery = artistQuery.order('name', { ascending: true });
        showQuery = showQuery.order('name', { ascending: true });
        break;
      case 'relevance':
      default:
        // Default relevance sorting (by popularity/view_count)
        artistQuery = artistQuery.order('popularity', { ascending: false });
        showQuery = showQuery.order('view_count', { ascending: false });
        break;
    }

    // Apply pagination
    const [artistsData, showsData] = await Promise.all([
      artistQuery.range(offset, offset + Math.ceil(limit / 2) - 1),
      showQuery.range(offset, offset + Math.floor(limit / 2) - 1)
    ]);

    if (artistsData.error) {
      console.error('Error searching artists:', artistsData.error);
    }

    if (showsData.error) {
      console.error('Error searching shows:', showsData.error);
    }

    const artists: SearchArtist[] = (artistsData.data || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.image_url,
      popularity: artist.popularity,
      upcomingShowsCount: artist.upcoming_shows?.[0]?.count || 0
    }));

    const shows: SearchShow[] = (showsData.data || []).map(show => ({
      id: show.id,
      name: show.name,
      date: show.date,
      artist: {
        id: show.artists.id,
        name: show.artists.name,
        image_url: show.artists.image_url
      },
      venue: {
        id: show.venues.id,
        name: show.venues.name,
        city: show.venues.city,
        state: show.venues.state,
        country: show.venues.country
      },
      voteCount: Array.isArray(show.setlists) ? show.setlists.reduce((total, setlist) => {
        const setlistSongs = Array.isArray(setlist.setlist_songs) ? setlist.setlist_songs : [];
        return total + setlistSongs.reduce((votes, song) => votes + (song.votes || 0), 0);
      }, 0) : 0
    }));

    const total = artists.length + shows.length;
    const hasMore = total >= limit;

    return {
      artists,
      shows,
      total,
      hasMore
    };

  } catch (error) {
    console.error("❌ Error in advanced search:", error);
    return { artists: [], shows: [], total: 0, hasMore: false };
  }
}

/**
 * Helper function to convert date range strings to actual dates
 */
function getDateRangeValues(dateRange: string): { start?: string; end?: string } {
  const now = new Date();
  let start: Date | undefined;
  let end: Date | undefined;

  switch (dateRange) {
    case 'this-week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Start of week
      end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week
      break;
    case 'this-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'next-month':
      start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      break;
    case 'next-3-months':
      start = now;
      end = new Date(now);
      end.setMonth(now.getMonth() + 3);
      break;
  }

  return {
    start: start?.toISOString(),
    end: end?.toISOString()
  };
}
