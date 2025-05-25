
import { supabase } from "@/integrations/supabase/client";
import * as ticketmasterService from "./ticketmaster";

export interface ArtistWithShows {
  id: string;
  name: string;
  image_url?: string;
  popularity?: number;
  upcoming_shows_count: number;
  next_show_date?: string;
  next_show_venue?: string;
}

// Search for artists that have upcoming shows
export async function searchArtistsWithUpcomingShows(query: string, limit: number = 10): Promise<ArtistWithShows[]> {
  try {
    console.log("Searching for artists with upcoming shows:", query);
    
    if (!query || query.trim().length < 2) {
      return [];
    }

    // First, search Ticketmaster for events and import any new artists/shows
    await ticketmasterService.searchAndImportEvents(query, 20);

    // Then search our database for artists with upcoming shows
    const today = new Date().toISOString();
    
    const { data: artistsData, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!fk_shows_artist_id (
          id,
          date,
          venues!fk_shows_venue_id (
            name,
            city
          )
        )
      `)
      .ilike('name', `%${query}%`)
      .limit(limit * 2); // Get more to filter properly

    if (error) {
      console.error("Error searching artists:", error);
      return [];
    }

    if (!artistsData || artistsData.length === 0) {
      return [];
    }

    // Filter and transform artists with upcoming shows
    const artistsWithUpcomingShows: ArtistWithShows[] = [];

    for (const artist of artistsData) {
      const shows = artist.shows || [];
      const upcomingShows = shows.filter(show => show.date >= today);
      
      if (upcomingShows.length > 0) {
        // Sort upcoming shows by date
        upcomingShows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextShow = upcomingShows[0];
        const venue = nextShow.venues as any;
        
        artistsWithUpcomingShows.push({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
          popularity: artist.popularity,
          upcoming_shows_count: upcomingShows.length,
          next_show_date: nextShow.date,
          next_show_venue: venue ? `${venue.name}, ${venue.city}` : undefined
        });
      }
    }

    // Sort by popularity and upcoming shows count
    artistsWithUpcomingShows.sort((a, b) => {
      const aScore = (a.popularity || 0) + (a.upcoming_shows_count * 10);
      const bScore = (b.popularity || 0) + (b.upcoming_shows_count * 10);
      return bScore - aScore;
    });

    console.log(`Found ${artistsWithUpcomingShows.length} artists with upcoming shows`);
    return artistsWithUpcomingShows.slice(0, limit);

  } catch (error) {
    console.error("Error in searchArtistsWithUpcomingShows:", error);
    return [];
  }
}

// Get trending artists based on show activity
export async function getTrendingArtistsWithShows(limit: number = 10): Promise<ArtistWithShows[]> {
  try {
    console.log("Getting trending artists with shows");
    
    const today = new Date().toISOString();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: artistsData, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!fk_shows_artist_id (
          id,
          date,
          view_count,
          venues!fk_shows_venue_id (
            name,
            city
          )
        )
      `)
      .order('popularity', { ascending: false })
      .limit(limit * 3); // Get more to filter properly

    if (error) {
      console.error("Error getting trending artists:", error);
      return [];
    }

    if (!artistsData || artistsData.length === 0) {
      return [];
    }

    // Filter and transform artists with upcoming shows
    const trendingArtists: ArtistWithShows[] = [];

    for (const artist of artistsData) {
      const shows = artist.shows || [];
      const upcomingShows = shows.filter(show => 
        show.date >= today && show.date <= thirtyDaysFromNow.toISOString()
      );
      
      if (upcomingShows.length > 0) {
        // Calculate trending score based on view counts and show count
        const totalViews = upcomingShows.reduce((sum, show) => sum + (show.view_count || 0), 0);
        const trendingScore = (artist.popularity || 0) + (totalViews * 2) + (upcomingShows.length * 5);
        
        // Sort upcoming shows by date
        upcomingShows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const nextShow = upcomingShows[0];
        const venue = nextShow.venues as any;
        
        trendingArtists.push({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
          popularity: trendingScore, // Use trending score as popularity
          upcoming_shows_count: upcomingShows.length,
          next_show_date: nextShow.date,
          next_show_venue: venue ? `${venue.name}, ${venue.city}` : undefined
        });
      }
    }

    // Sort by trending score
    trendingArtists.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    console.log(`Found ${trendingArtists.length} trending artists with upcoming shows`);
    return trendingArtists.slice(0, limit);

  } catch (error) {
    console.error("Error in getTrendingArtistsWithShows:", error);
    return [];
  }
}
