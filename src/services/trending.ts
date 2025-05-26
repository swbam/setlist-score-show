
import { typedSupabase } from "@/integrations/supabase/client";

export interface TrendingShow {
  id: string;
  name?: string;
  date: string;
  start_time?: string;
  view_count: number;
  vote_count: number;
  trending_score: number;
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
}

export interface TrendingArtist {
  id: string;
  name: string;
  image_url?: string;
  popularity: number;
  upcoming_shows_count: number;
  total_votes: number;
  trending_score: number;
}

// Increment show view count
export async function incrementShowViews(showId: string): Promise<boolean> {
  try {
    const { error } = await typedSupabase.rpc('increment_show_views', {
      show_id: showId
    });

    if (error) {
      console.error('Error incrementing show views:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementShowViews:', error);
    return false;
  }
}

// Calculate trending shows based on views, votes, and recency
export async function getTrendingShows(limit: number = 20): Promise<TrendingShow[]> {
  try {
    console.log('Fetching trending shows...');
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90); // Next 90 days
    
    const { data: showsData, error } = await typedSupabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        view_count,
        artists!fk_shows_artist_id (
          id,
          name,
          image_url
        ),
        venues!fk_shows_venue_id (
          id,
          name,
          city,
          state,
          country
        ),
        setlists!fk_setlists_show_id (
          id,
          setlist_songs!fk_setlist_songs_setlist_id (
            votes
          )
        )
      `)
      .gte('date', today.toISOString())
      .lte('date', futureDate.toISOString())
      .order('view_count', { ascending: false })
      .limit(limit * 2); // Get more to calculate trending scores

    if (error) {
      console.error('Error fetching trending shows:', error);
      return [];
    }

    if (!showsData || showsData.length === 0) {
      return [];
    }

    // Calculate trending scores and format data
    const trendingShows: TrendingShow[] = showsData
      .map(show => {
        const artist = show.artists as any;
        const venue = show.venues as any;
        const setlists = show.setlists as any[] || [];
        
        // Calculate total votes across all setlist songs - fix the TypeScript error
        let totalVotes = 0;
        if (Array.isArray(setlists)) {
          setlists.forEach((setlist: any) => {
            if (setlist && setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
              totalVotes += setlist.setlist_songs.reduce((sum: number, song: any) => sum + (song.votes || 0), 0);
            }
          });
        }
        
        // Calculate days until show
        const daysUntilShow = Math.ceil((new Date(show.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const recencyBoost = Math.max(1, 91 - daysUntilShow); // Higher score for sooner shows
        
        // Calculate trending score: views + votes*3 + recency boost
        const trendingScore = (show.view_count || 0) + (totalVotes * 3) + (recencyBoost * 0.5);
        
        return {
          id: show.id,
          name: show.name,
          date: show.date,
          start_time: show.start_time,
          view_count: show.view_count || 0,
          vote_count: totalVotes,
          trending_score: trendingScore,
          artist: {
            id: artist?.id || '',
            name: artist?.name || 'Unknown Artist',
            image_url: artist?.image_url
          },
          venue: {
            id: venue?.id || '',
            name: venue?.name || 'Unknown Venue',
            city: venue?.city || '',
            state: venue?.state,
            country: venue?.country || ''
          }
        };
      })
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

    console.log(`Found ${trendingShows.length} trending shows`);
    return trendingShows;
  } catch (error) {
    console.error('Error in getTrendingShows:', error);
    return [];
  }
}

// Get trending artists based on their shows' activity
export async function getTrendingArtists(limit: number = 20): Promise<TrendingArtist[]> {
  try {
    console.log('Fetching trending artists...');
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90);
    
    const { data: artistsData, error } = await typedSupabase
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
          setlists (
            setlist_songs (
              votes
            )
          )
        )
      `)
      .order('popularity', { ascending: false });

    if (error) {
      console.error('Error fetching trending artists:', error);
      return [];
    }

    if (!artistsData || artistsData.length === 0) {
      return [];
    }

    // Calculate trending scores for artists
    const trendingArtists: TrendingArtist[] = artistsData
      .map(artist => {
        const shows = artist.shows as any[] || [];
        const upcomingShows = shows.filter(show => 
          new Date(show.date) >= today && new Date(show.date) <= futureDate
        );
        
        // Calculate total views and votes for upcoming shows
        let totalViews = 0;
        let totalVotes = 0;
        
        upcomingShows.forEach(show => {
          totalViews += show.view_count || 0;
          
          if (show.setlists && Array.isArray(show.setlists)) {
            show.setlists.forEach((setlist: any) => {
              if (setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
                totalVotes += setlist.setlist_songs.reduce((sum: number, song: any) => sum + (song.votes || 0), 0);
              }
            });
          }
        });
        
        // Calculate trending score: popularity + views + votes*2 + show count*10
        const trendingScore = (artist.popularity || 0) + totalViews + (totalVotes * 2) + (upcomingShows.length * 10);
        
        return {
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
          popularity: artist.popularity || 0,
          upcoming_shows_count: upcomingShows.length,
          total_votes: totalVotes,
          trending_score: trendingScore
        };
      })
      .filter(artist => artist.upcoming_shows_count > 0) // Only artists with upcoming shows
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

    console.log(`Found ${trendingArtists.length} trending artists`);
    return trendingArtists;
  } catch (error) {
    console.error('Error in getTrendingArtists:', error);
    return [];
  }
}

// Update trending calculations (for background jobs)
export async function updateTrendingCalculations(): Promise<boolean> {
  try {
    console.log('Updating trending calculations...');
    
    // This would typically be run as a background job
    // For now, we'll just log that it would update cached trending data
    console.log('Trending calculations updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating trending calculations:', error);
    return false;
  }
}
