
import { supabase } from '@/integrations/supabase/client';

interface TrendingArtist {
  id: string;
  name: string;
  image_url?: string;
  popularity: number;
  trending_score: number;
  total_shows: number;
  total_votes: number;
}

interface TrendingShow {
  id: string;
  name: string;
  date: string;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    name: string;
    city: string;
    state?: string;
  };
  trending_score: number;
  view_count: number;
  vote_count: number;
}

interface TrendingSong {
  id: string;
  name: string;
  album: string;
  artist: {
    id: string;
    name: string;
  };
  trending_score: number;
  total_votes: number;
  shows_appearing: number;
}

// Enhanced trending calculations with multiple factors
export async function getTrendingArtistsEnhanced(limit: number = 10): Promise<TrendingArtist[]> {
  try {
    console.log('[Enhanced Trending] Getting trending artists');

    // Get artists with recent show activity and voting data
    const { data: artistData, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!inner(
          id,
          date,
          view_count,
          setlists(
            setlist_songs(
              votes
            )
          )
        )
      `)
      .gte('shows.date', new Date().toISOString())
      .order('popularity', { ascending: false })
      .limit(limit * 2); // Get more to filter and sort

    if (error) {
      console.error('[Enhanced Trending] Error fetching artist data:', error);
      return [];
    }

    if (!artistData || !Array.isArray(artistData)) {
      console.log('[Enhanced Trending] No artist data found');
      return [];
    }

    // Calculate trending scores
    const trendingArtists: TrendingArtist[] = artistData.map(artist => {
      const shows = Array.isArray(artist.shows) ? artist.shows : [];
      const totalShows = shows.length;
      const totalViews = shows.reduce((sum, show) => sum + (show.view_count || 0), 0);
      
      // Calculate total votes across all shows
      let totalVotes = 0;
      shows.forEach(show => {
        if (show.setlists && Array.isArray(show.setlists)) {
          show.setlists.forEach((setlist: any) => {
            if (setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
              setlist.setlist_songs.forEach((song: any) => {
                totalVotes += song.votes || 0;
              });
            }
          });
        }
      });

      // Calculate trending score based on multiple factors
      const viewScore = totalViews * 0.3;
      const voteScore = totalVotes * 0.4;
      const popularityScore = (artist.popularity || 0) * 0.2;
      const showScore = totalShows * 0.1;
      
      const trendingScore = viewScore + voteScore + popularityScore + showScore;

      return {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url,
        popularity: artist.popularity || 0,
        trending_score: Math.round(trendingScore),
        total_shows: totalShows,
        total_votes: totalVotes
      };
    });

    // Sort by trending score and return top results
    return trendingArtists
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

  } catch (error) {
    console.error('[Enhanced Trending] Error in getTrendingArtistsEnhanced:', error);
    return [];
  }
}

export async function getTrendingShowsEnhanced(limit: number = 10): Promise<TrendingShow[]> {
  try {
    console.log('[Enhanced Trending] Getting trending shows');

    const { data: showData, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artists!inner(
          id,
          name,
          image_url
        ),
        venues!inner(
          name,
          city,
          state
        ),
        setlists(
          setlist_songs(
            votes
          )
        )
      `)
      .gte('date', new Date().toISOString())
      .order('view_count', { ascending: false })
      .limit(limit * 2);

    if (error) {
      console.error('[Enhanced Trending] Error fetching show data:', error);
      return [];
    }

    if (!showData || !Array.isArray(showData)) {
      console.log('[Enhanced Trending] No show data found');
      return [];
    }

    // Calculate trending scores for shows
    const trendingShows: TrendingShow[] = showData.map(show => {
      // Calculate total votes for this show
      let totalVotes = 0;
      if (show.setlists && Array.isArray(show.setlists)) {
        show.setlists.forEach((setlist: any) => {
          if (setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
            setlist.setlist_songs.forEach((song: any) => {
              totalVotes += song.votes || 0;
            });
          }
        });
      }

      // Calculate time-based score (newer shows get higher scores)
      const showDate = new Date(show.date);
      const now = new Date();
      const daysUntilShow = Math.max(0, (showDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const timeScore = Math.max(0, 100 - daysUntilShow); // Closer shows get higher scores

      const viewScore = (show.view_count || 0) * 0.4;
      const voteScore = totalVotes * 0.5;
      const timeWeight = timeScore * 0.1;
      
      const trendingScore = viewScore + voteScore + timeWeight;

      return {
        id: show.id,
        name: show.name || `${show.artists.name} Concert`,
        date: show.date,
        artist: {
          id: show.artists.id,
          name: show.artists.name,
          image_url: show.artists.image_url
        },
        venue: {
          name: show.venues.name,
          city: show.venues.city,
          state: show.venues.state
        },
        trending_score: Math.round(trendingScore),
        view_count: show.view_count || 0,
        vote_count: totalVotes
      };
    });

    // Sort by trending score and return top results
    return trendingShows
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

  } catch (error) {
    console.error('[Enhanced Trending] Error in getTrendingShowsEnhanced:', error);
    return [];
  }
}

export async function getTrendingSongsEnhanced(limit: number = 10): Promise<TrendingSong[]> {
  try {
    console.log('[Enhanced Trending] Getting trending songs');

    const { data: songData, error } = await supabase
      .from('songs')
      .select(`
        id,
        name,
        album,
        artists!inner(
          id,
          name
        ),
        setlist_songs!inner(
          votes,
          setlists!inner(
            shows!inner(
              date
            )
          )
        )
      `)
      .gte('setlist_songs.setlists.shows.date', new Date().toISOString())
      .limit(limit * 3);

    if (error) {
      console.error('[Enhanced Trending] Error fetching song data:', error);
      return [];
    }

    if (!songData || !Array.isArray(songData)) {
      console.log('[Enhanced Trending] No song data found');
      return [];
    }

    // Calculate trending scores for songs
    const songStats = new Map<string, {
      song: any;
      totalVotes: number;
      showsAppearing: number;
      recentVotes: number;
    }>();

    songData.forEach(song => {
      if (!songStats.has(song.id)) {
        songStats.set(song.id, {
          song,
          totalVotes: 0,
          showsAppearing: 0,
          recentVotes: 0
        });
      }

      const stats = songStats.get(song.id)!;
      if (song.setlist_songs && Array.isArray(song.setlist_songs)) {
        song.setlist_songs.forEach((setlistSong: any) => {
          stats.totalVotes += setlistSong.votes || 0;
          stats.showsAppearing += 1;
          
          // Weight recent votes more heavily
          if (setlistSong.setlists?.shows?.date) {
            const showDate = new Date(setlistSong.setlists.shows.date);
            const daysAgo = (Date.now() - showDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysAgo <= 7) {
              stats.recentVotes += (setlistSong.votes || 0) * 2; // Double weight for recent votes
            }
          }
        });
      }
    });

    // Convert to trending songs array
    const trendingSongs: TrendingSong[] = Array.from(songStats.values()).map(stats => {
      const voteScore = stats.totalVotes * 0.6;
      const recentScore = stats.recentVotes * 0.3;
      const popularityScore = stats.showsAppearing * 0.1;
      
      const trendingScore = voteScore + recentScore + popularityScore;

      return {
        id: stats.song.id,
        name: stats.song.name,
        album: stats.song.album,
        artist: {
          id: stats.song.artists.id,
          name: stats.song.artists.name
        },
        trending_score: Math.round(trendingScore),
        total_votes: stats.totalVotes,
        shows_appearing: stats.showsAppearing
      };
    });

    // Sort by trending score and return top results
    return trendingSongs
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit);

  } catch (error) {
    console.error('[Enhanced Trending] Error in getTrendingSongsEnhanced:', error);
    return [];
  }
}

// Calculate trending scores based on voting activity
export async function calculateVotingTrendingScore(showId: string): Promise<number> {
  try {
    const { data: voteData, error } = await supabase
      .from('votes')
      .select(`
        created_at,
        setlist_songs!inner(
          setlists!inner(
            show_id
          )
        )
      `)
      .eq('setlist_songs.setlists.show_id', showId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (error || !voteData) {
      return 0;
    }

    // Weight votes by recency
    const now = Date.now();
    let trendingScore = 0;

    voteData.forEach(vote => {
      const voteTime = new Date(vote.created_at).getTime();
      const hoursAgo = (now - voteTime) / (1000 * 60 * 60);
      
      // More recent votes get higher weight
      const timeWeight = Math.max(0, 1 - (hoursAgo / 24));
      trendingScore += timeWeight;
    });

    return Math.round(trendingScore);
  } catch (error) {
    console.error('[Enhanced Trending] Error calculating voting trending score:', error);
    return 0;
  }
}

// Update trending scores in database
export async function updateTrendingScores(): Promise<void> {
  try {
    console.log('[Enhanced Trending] Updating trending scores');

    // This would be implemented as a background job
    // For now, we'll just log that it would update scores
    console.log('[Enhanced Trending] Trending scores update scheduled');

  } catch (error) {
    console.error('[Enhanced Trending] Error updating trending scores:', error);
  }
}
