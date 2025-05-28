
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced trending algorithm service that provides more sophisticated 
 * trending calculations with time decay, velocity, and engagement factors
 */

export interface TrendingArtist {
  id: string;
  name: string;
  image_url?: string;
  trending_score: number;
  vote_velocity: number;
  recent_votes: number;
  upcoming_shows: number;
  popularity_boost: number;
  total_engagement: number;
}

export interface TrendingShow {
  id: string;
  name: string;
  date: string;
  trending_score: number;
  vote_velocity: number;
  recent_votes: number;
  time_until_show: number;
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
}

export interface TrendingSong {
  id: string;
  name: string;
  trending_score: number;
  vote_velocity: number;
  recent_votes: number;
  total_votes: number;
  artist: {
    id: string;
    name: string;
  };
}

/**
 * Calculate trending artists using basic algorithm (fallback)
 */
export async function calculateTrendingArtists(
  timeWindowHours: number = 24,
  limit: number = 20
): Promise<TrendingArtist[]> {
  try {
    const timeWindowStart = new Date();
    timeWindowStart.setHours(timeWindowStart.getHours() - timeWindowHours);

    // Get artists with recent voting activity
    const { data: artistsData, error } = await supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        popularity,
        shows!shows_artist_id_fkey(
          id,
          date,
          setlists(
            setlist_songs(
              votes(created_at)
            )
          )
        )
      `)
      .gte('shows.date', new Date().toISOString())
      .limit(limit);

    if (error) {
      console.error('Error calculating trending artists:', error);
      return [];
    }

    // Calculate trending scores
    const trendingArtists: TrendingArtist[] = (artistsData || []).map(artist => {
      const recentVotes = countRecentVotes(artist.shows, timeWindowStart);
      const upcomingShows = artist.shows?.length || 0;
      const voteVelocity = calculateVoteVelocity(recentVotes, timeWindowHours);
      const popularityBoost = (artist.popularity || 0) / 100;
      
      const trendingScore = (recentVotes * 2) + (voteVelocity * 3) + (upcomingShows * 1) + popularityBoost;

      return {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        recent_votes: recentVotes,
        upcoming_shows: upcomingShows,
        popularity_boost: popularityBoost,
        total_engagement: recentVotes + upcomingShows
      };
    })
    .filter(artist => artist.trending_score > 0)
    .sort((a, b) => b.trending_score - a.trending_score);

    return trendingArtists;
  } catch (error) {
    console.error('Error in calculateTrendingArtists:', error);
    return [];
  }
}

/**
 * Calculate trending shows using basic algorithm (fallback)
 */
export async function calculateTrendingShows(
  timeWindowHours: number = 48,
  limit: number = 15
): Promise<TrendingShow[]> {
  try {
    const timeWindowStart = new Date();
    timeWindowStart.setHours(timeWindowStart.getHours() - timeWindowHours);

    // Get shows with recent activity
    const { data: showsData, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist:artists!shows_artist_id_fkey(id, name, image_url),
        venue:venues!shows_venue_id_fkey(name, city, state),
        setlists(
          setlist_songs(
            votes(created_at)
          )
        )
      `)
      .gte('date', new Date().toISOString())
      .order('date')
      .limit(limit * 2); // Get more to filter better results

    if (error) {
      console.error('Error calculating trending shows:', error);
      return [];
    }

    // Calculate trending scores for shows
    const trendingShows: TrendingShow[] = (showsData || []).map(show => {
      const recentVotes = countRecentVotes(show.setlists, timeWindowStart);
      const timeUntilShow = getTimeUntilShow(show.date);
      const voteVelocity = calculateVoteVelocity(recentVotes, timeWindowHours);
      
      // Time decay factor (closer shows get higher scores)
      const timeDecayFactor = Math.max(0.1, 1 / (1 + timeUntilShow / (24 * 7))); // Week-based decay
      
      const trendingScore = (recentVotes * voteVelocity * timeDecayFactor) + 
                           (timeUntilShow < 7 ? 50 : 0); // Boost for shows within a week

      return {
        id: show.id,
        name: show.name || 'Concert',
        date: show.date,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        recent_votes: recentVotes,
        time_until_show: timeUntilShow,
        artist: show.artist,
        venue: show.venue
      };
    })
    .filter(show => show.trending_score > 0)
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit);

    return trendingShows;

  } catch (error) {
    console.error('Error in calculateTrendingShows:', error);
    return [];
  }
}

/**
 * Calculate trending songs using basic algorithm (fallback)
 */
export async function calculateTrendingSongs(
  timeWindowHours: number = 12,
  limit: number = 30
): Promise<TrendingSong[]> {
  try {
    const timeWindowStart = new Date();
    timeWindowStart.setHours(timeWindowStart.getHours() - timeWindowHours);

    // Get songs with recent voting activity
    const { data: songsData, error } = await supabase
      .from('songs')
      .select(`
        id,
        name,
        artist:artists!songs_artist_id_fkey(id, name),
        setlist_songs(
          votes(created_at)
        )
      `)
      .limit(limit * 3); // Get more to filter better results

    if (error) {
      console.error('Error calculating trending songs:', error);
      return [];
    }

    // Calculate trending scores for songs
    const trendingSongs: TrendingSong[] = (songsData || []).map(song => {
      const allVotes = song.setlist_songs?.flatMap(ss => ss.votes || []) || [];
      const recentVotes = allVotes.filter(vote => 
        new Date(vote.created_at) >= timeWindowStart
      ).length;
      
      const totalVotes = allVotes.length;
      const voteVelocity = calculateVoteVelocity(recentVotes, timeWindowHours);
      const trendingScore = recentVotes * voteVelocity + (totalVotes * 0.1);

      return {
        id: song.id,
        name: song.name,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        recent_votes: recentVotes,
        total_votes: totalVotes,
        artist: song.artist
      };
    })
    .filter(song => song.trending_score > 0)
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, limit);

    return trendingSongs;

  } catch (error) {
    console.error('Error in calculateTrendingSongs:', error);
    return [];
  }
}

/**
 * Get personalized trending content based on user's followed artists
 */
export async function getPersonalizedTrending(
  userId: string,
  timeWindowHours: number = 24
): Promise<{
  artists: TrendingArtist[];
  shows: TrendingShow[];
  songs: TrendingSong[];
}> {
  try {
    const timeWindowStart = new Date();
    timeWindowStart.setHours(timeWindowStart.getHours() - timeWindowHours);

    // Get user's followed artists
    const { data: followedArtists } = await supabase
      .from('user_artists')
      .select('artist_id')
      .eq('user_id', userId);

    const artistIds = followedArtists?.map(fa => fa.artist_id) || [];

    if (artistIds.length === 0) {
      // Return general trending if user doesn't follow any artists
      return {
        artists: await calculateTrendingArtists(timeWindowHours, 10),
        shows: await calculateTrendingShows(timeWindowHours * 2, 8),
        songs: await calculateTrendingSongs(timeWindowHours / 2, 15)
      };
    }

    // Get trending content filtered by followed artists
    const [personalizedShows, personalizedSongs] = await Promise.all([
      getPersonalizedTrendingShows(artistIds, timeWindowStart),
      getPersonalizedTrendingSongs(artistIds, timeWindowStart)
    ]);

    return {
      artists: await calculateTrendingArtists(timeWindowHours, 10),
      shows: personalizedShows,
      songs: personalizedSongs
    };

  } catch (error) {
    console.error('Error getting personalized trending:', error);
    return {
      artists: [],
      shows: [],
      songs: []
    };
  }
}

/**
 * Get trending shows for followed artists
 */
async function getPersonalizedTrendingShows(
  artistIds: string[],
  timeWindowStart: Date
): Promise<TrendingShow[]> {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        artist:artists!shows_artist_id_fkey(id, name, image_url),
        venue:venues!shows_venue_id_fkey(name, city, state),
        setlists(
          setlist_songs(
            votes(created_at)
          )
        )
      `)
      .in('artist_id', artistIds)
      .gte('date', new Date().toISOString())
      .order('date');

    if (error) throw error;

    // Calculate trending scores for personalized shows
    const trendingShows: TrendingShow[] = (data || []).map(show => {
      const recentVotes = countRecentVotes(show.setlists || [], timeWindowStart);
      const timeUntilShow = getTimeUntilShow(show.date);
      const voteVelocity = calculateVoteVelocity(recentVotes, 24);
      
      // Time decay factor (closer shows get higher scores)
      const timeDecayFactor = Math.max(0.1, 1 / (1 + timeUntilShow / (24 * 7))); // Week-based decay
      
      const trendingScore = (recentVotes * voteVelocity * timeDecayFactor) + 
                           (timeUntilShow < 7 ? 50 : 0); // Boost for shows within a week

      return {
        id: show.id,
        name: show.name || 'Concert',
        date: show.date,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        recent_votes: recentVotes,
        time_until_show: timeUntilShow,
        artist: show.artist,
        venue: show.venue
      };
    })
    .filter(show => show.trending_score > 0)
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, 8);

    return trendingShows;

  } catch (error) {
    console.error('Error getting personalized trending shows:', error);
    return [];
  }
}

/**
 * Get trending songs for followed artists
 */
async function getPersonalizedTrendingSongs(
  artistIds: string[],
  timeWindowStart: Date
): Promise<TrendingSong[]> {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select(`
        id,
        name,
        artist:artists!songs_artist_id_fkey(id, name),
        setlist_songs(
          votes(created_at)
        )
      `)
      .in('artist_id', artistIds);

    if (error) throw error;

    // Calculate trending scores for personalized songs
    const trendingSongs: TrendingSong[] = (data || []).map(song => {
      const allVotes = song.setlist_songs?.flatMap(ss => ss.votes || []) || [];
      const recentVotes = allVotes.filter(vote => 
        new Date(vote.created_at) >= timeWindowStart
      ).length;
      
      const totalVotes = allVotes.length;
      const voteVelocity = calculateVoteVelocity(recentVotes, 12);
      const trendingScore = recentVotes * voteVelocity + (totalVotes * 0.1);

      return {
        id: song.id,
        name: song.name,
        trending_score: trendingScore,
        vote_velocity: voteVelocity,
        recent_votes: recentVotes,
        total_votes: totalVotes,
        artist: song.artist
      };
    })
    .filter(song => song.trending_score > 0)
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, 15);

    return trendingSongs;

  } catch (error) {
    console.error('Error getting personalized trending songs:', error);
    return [];
  }
}

/**
 * Helper function to count recent votes from nested setlist data
 */
function countRecentVotes(setlists: any[], timeWindowStart: Date): number {
  let count = 0;
  if (Array.isArray(setlists)) {
    setlists.forEach(setlist => {
      if (setlist.setlist_songs && Array.isArray(setlist.setlist_songs)) {
        setlist.setlist_songs.forEach((setlistSong: any) => {
          if (setlistSong.votes && Array.isArray(setlistSong.votes)) {
            setlistSong.votes.forEach((vote: any) => {
              if (new Date(vote.created_at) >= timeWindowStart) {
                count++;
              }
            });
          }
        });
      }
    });
  }
  return count;
}

/**
 * Calculate time until show in days
 */
function getTimeUntilShow(showDate: string): number {
  const now = new Date();
  const show = new Date(showDate);
  const diffTime = show.getTime() - now.getTime();
  return Math.max(0, diffTime / (1000 * 60 * 60 * 24)); // Days
}

/**
 * Calculate vote velocity (votes per hour)
 */
function calculateVoteVelocity(recentVotes: number, timeWindowHours: number): number {
  return timeWindowHours > 0 ? recentVotes / timeWindowHours : 0;
}

/**
 * Update trending cache with fresh calculations
 */
export async function updateTrendingCache(): Promise<void> {
  try {
    console.log('Updating trending cache...');

    const [trendingArtists, trendingShows, trendingSongs] = await Promise.all([
      calculateTrendingArtists(24, 20),
      calculateTrendingShows(48, 15),
      calculateTrendingSongs(12, 30)
    ]);

    // Store results in memory or local storage as cache
    // Note: We're not using a database table since it doesn't exist
    if (typeof window !== 'undefined') {
      localStorage.setItem('trending_artists', JSON.stringify(trendingArtists));
      localStorage.setItem('trending_shows', JSON.stringify(trendingShows));
      localStorage.setItem('trending_songs', JSON.stringify(trendingSongs));
      localStorage.setItem('trending_updated_at', new Date().toISOString());
    }

    console.log('Trending cache updated successfully');

  } catch (error) {
    console.error('Error updating trending cache:', error);
  }
}

/**
 * Get cached trending data with fallback to fresh calculation
 */
export async function getCachedTrending(
  type: 'artists' | 'shows' | 'songs'
): Promise<TrendingArtist[] | TrendingShow[] | TrendingSong[]> {
  try {
    // Check cache in localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`trending_${type}`);
      const updatedAt = localStorage.getItem('trending_updated_at');
      
      if (cached && updatedAt) {
        const cacheAge = Date.now() - new Date(updatedAt).getTime();
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (cacheAge < thirtyMinutes) {
          return JSON.parse(cached);
        }
      }
    }

    // Cache is stale or doesn't exist, calculate fresh data
    switch (type) {
      case 'artists':
        return await calculateTrendingArtists();
      case 'shows':
        return await calculateTrendingShows();
      case 'songs':
        return await calculateTrendingSongs();
      default:
        return [];
    }

  } catch (error) {
    console.error(`Error getting cached trending ${type}:`, error);
    return [];
  }
}
