import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced user analytics service that provides detailed insights
 * into user behavior, engagement patterns, and voting history
 */

export interface UserAnalytics {
  userId: string;
  totalVotes: number;
  averageVotesPerShow: number;
  favoriteGenres: string[];
  mostActiveTimeOfDay: string;
  votingStreak: number;
  accuracyScore: number;
  engagementScore: number;
  followedArtists: number;
  upcomingShows: number;
  recentActivity: ActivitySummary;
  votingPatterns: VotingPattern[];
  artistPreferences: ArtistPreference[];
}

export interface ActivitySummary {
  last7Days: {
    votes: number;
    showsVotedOn: number;
    newArtistsFollowed: number;
  };
  last30Days: {
    votes: number;
    showsVotedOn: number;
    newArtistsFollowed: number;
  };
  allTime: {
    votes: number;
    showsVotedOn: number;
    artistsFollowed: number;
    firstVoteDate?: string;
  };
}

export interface VotingPattern {
  timeOfDay: number; // 0-23 hour
  voteCount: number;
  averageSessionLength: number; // minutes
}

export interface ArtistPreference {
  artistId: string;
  artistName: string;
  imageUrl?: string;
  votes: number;
  shows: number;
  lastVoteDate: string;
  engagementScore: number;
}

export interface UserEngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  retentionRate: {
    day1: number;
    day7: number;
    day30: number;
  };
  topFeatures: Array<{
    feature: string;
    usage: number;
  }>;
}

/**
 * Get comprehensive analytics for a specific user
 */
export async function getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
  try {
    const [
      votingData,
      followingData,
      activityData,
      accuracyData
    ] = await Promise.all([
      getUserVotingData(userId),
      getUserFollowingData(userId),
      getUserActivityData(userId),
      getUserAccuracyData(userId)
    ]);

    if (!votingData) {
      return null;
    }

    const analytics: UserAnalytics = {
      userId,
      totalVotes: votingData.totalVotes,
      averageVotesPerShow: votingData.averageVotesPerShow,
      favoriteGenres: votingData.favoriteGenres,
      mostActiveTimeOfDay: votingData.mostActiveTimeOfDay,
      votingStreak: votingData.votingStreak,
      accuracyScore: accuracyData?.accuracyScore || 0,
      engagementScore: calculateEngagementScore(votingData, followingData, activityData),
      followedArtists: followingData?.followedArtists || 0,
      upcomingShows: followingData?.upcomingShows || 0,
      recentActivity: activityData || getEmptyActivitySummary(),
      votingPatterns: votingData.votingPatterns,
      artistPreferences: votingData.artistPreferences
    };

    return analytics;

  } catch (error) {
    console.error('Error getting user analytics:', error);
    return null;
  }
}

/**
 * Get user voting data and patterns
 */
async function getUserVotingData(userId: string) {
  try {
    // Get all user votes with related data
    const { data: votes, error } = await supabase
      .from('votes')
      .select(`
        id,
        created_at,
        setlist_songs!inner(
          setlists!inner(
            shows!inner(
              id,
              artist:artists!inner(id, name, image_url, genres)
            )
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const totalVotes = votes?.length || 0;
    
    if (totalVotes === 0) {
      return {
        totalVotes: 0,
        averageVotesPerShow: 0,
        favoriteGenres: [],
        mostActiveTimeOfDay: '12:00',
        votingStreak: 0,
        votingPatterns: [],
        artistPreferences: []
      };
    }

    // Calculate unique shows voted on
    const uniqueShows = new Set(
      votes?.map(vote => vote.setlist_songs.setlists.shows.id) || []
    );
    const averageVotesPerShow = Math.round(totalVotes / uniqueShows.size);

    // Calculate favorite genres
    const genreCounts = new Map<string, number>();
    votes?.forEach(vote => {
      const genres = vote.setlist_songs.setlists.shows.artist.genres || [];
      genres.forEach(genre => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    });

    const favoriteGenres = Array.from(genreCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // Calculate most active time of day
    const hourCounts = new Array(24).fill(0);
    votes?.forEach(vote => {
      const hour = new Date(vote.created_at).getHours();
      hourCounts[hour]++;
    });

    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    const mostActiveTimeOfDay = `${mostActiveHour.toString().padStart(2, '0')}:00`;

    // Calculate voting patterns
    const votingPatterns: VotingPattern[] = hourCounts.map((count, hour) => ({
      timeOfDay: hour,
      voteCount: count,
      averageSessionLength: calculateAverageSessionLength(votes, hour)
    }));

    // Calculate artist preferences
    const artistCounts = new Map<string, { votes: number; shows: Set<string>; lastVote: string; artist: any }>();
    
    votes?.forEach(vote => {
      const artist = vote.setlist_songs.setlists.shows.artist;
      const showId = vote.setlist_songs.setlists.shows.id;
      
      if (!artistCounts.has(artist.id)) {
        artistCounts.set(artist.id, {
          votes: 0,
          shows: new Set(),
          lastVote: vote.created_at,
          artist
        });
      }
      
      const data = artistCounts.get(artist.id)!;
      data.votes++;
      data.shows.add(showId);
      if (new Date(vote.created_at) > new Date(data.lastVote)) {
        data.lastVote = vote.created_at;
      }
    });

    const artistPreferences: ArtistPreference[] = Array.from(artistCounts.entries())
      .map(([artistId, data]) => ({
        artistId,
        artistName: data.artist.name,
        imageUrl: data.artist.image_url,
        votes: data.votes,
        shows: data.shows.size,
        lastVoteDate: data.lastVote,
        engagementScore: data.votes * data.shows.size
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);

    // Calculate voting streak
    const votingStreak = calculateVotingStreak(votes || []);

    return {
      totalVotes,
      averageVotesPerShow,
      favoriteGenres,
      mostActiveTimeOfDay,
      votingStreak,
      votingPatterns,
      artistPreferences
    };

  } catch (error) {
    console.error('Error getting user voting data:', error);
    return null;
  }
}

/**
 * Get user following data
 */
async function getUserFollowingData(userId: string) {
  try {
    const { data: followingData, error } = await supabase
      .from('user_artists')
      .select(`
        artist:artists!inner(
          id,
          shows!inner(id, date)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const followedArtists = followingData?.length || 0;
    
    // Count upcoming shows for followed artists
    const now = new Date();
    let upcomingShows = 0;
    
    followingData?.forEach(item => {
      item.artist.shows.forEach((show: any) => {
        if (new Date(show.date) > now) {
          upcomingShows++;
        }
      });
    });

    return {
      followedArtists,
      upcomingShows
    };

  } catch (error) {
    console.error('Error getting user following data:', error);
    return null;
  }
}

/**
 * Get user activity data for different time periods
 */
async function getUserActivityData(userId: string): Promise<ActivitySummary | null> {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get voting activity
    const [votes7Days, votes30Days, votesAllTime] = await Promise.all([
      getVotingActivity(userId, last7Days),
      getVotingActivity(userId, last30Days),
      getVotingActivity(userId)
    ]);

    // Get artist following activity
    const [following7Days, following30Days, followingAllTime] = await Promise.all([
      getFollowingActivity(userId, last7Days),
      getFollowingActivity(userId, last30Days),
      getFollowingActivity(userId)
    ]);

    return {
      last7Days: {
        votes: votes7Days.votes,
        showsVotedOn: votes7Days.shows,
        newArtistsFollowed: following7Days
      },
      last30Days: {
        votes: votes30Days.votes,
        showsVotedOn: votes30Days.shows,
        newArtistsFollowed: following30Days
      },
      allTime: {
        votes: votesAllTime.votes,
        showsVotedOn: votesAllTime.shows,
        artistsFollowed: followingAllTime,
        firstVoteDate: votesAllTime.firstVote
      }
    };

  } catch (error) {
    console.error('Error getting user activity data:', error);
    return null;
  }
}

/**
 * Get user accuracy data (how well they predict setlists)
 */
async function getUserAccuracyData(userId: string) {
  try {
    // This would require comparing user votes to actual played setlists
    // For now, return a placeholder implementation
    const { data: userVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId);

    // Placeholder accuracy calculation
    const accuracyScore = Math.min(100, Math.max(0, 50 + (userVotes?.length || 0) * 0.5));

    return {
      accuracyScore: Math.round(accuracyScore)
    };

  } catch (error) {
    console.error('Error getting user accuracy data:', error);
    return { accuracyScore: 0 };
  }
}

/**
 * Helper functions
 */

function calculateEngagementScore(votingData: any, followingData: any, activityData: any): number {
  const voteScore = Math.min(100, votingData.totalVotes * 0.5);
  const followingScore = Math.min(50, (followingData?.followedArtists || 0) * 2);
  const recentActivityScore = Math.min(50, (activityData?.last7Days?.votes || 0) * 5);
  
  return Math.round(voteScore + followingScore + recentActivityScore);
}

function calculateAverageSessionLength(votes: any[], hour: number): number {
  // Simplified session length calculation
  const hourVotes = votes?.filter(vote => new Date(vote.created_at).getHours() === hour) || [];
  return hourVotes.length > 0 ? Math.min(60, hourVotes.length * 2) : 0;
}

function calculateVotingStreak(votes: any[]): number {
  if (!votes || votes.length === 0) return 0;
  
  // Simple streak calculation - consecutive days with votes
  const voteDates = votes
    .map(vote => new Date(vote.created_at).toDateString())
    .filter((date, index, array) => array.indexOf(date) === index)
    .sort();

  let streak = 1;
  let currentStreak = 1;

  for (let i = 1; i < voteDates.length; i++) {
    const currentDate = new Date(voteDates[i]);
    const prevDate = new Date(voteDates[i - 1]);
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
      streak = Math.max(streak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return streak;
}

async function getVotingActivity(userId: string, since?: Date) {
  const query = supabase
    .from('votes')
    .select(`
      id,
      created_at,
      setlist_songs!inner(
        setlists!inner(
          shows!inner(id)
        )
      )
    `)
    .eq('user_id', userId);

  if (since) {
    query.gte('created_at', since.toISOString());
  }

  const { data } = await query;

  const votes = data?.length || 0;
  const shows = new Set(data?.map(vote => vote.setlist_songs.setlists.shows.id)).size;
  const firstVote = data && data.length > 0 
    ? data.reduce((earliest, vote) => 
        new Date(vote.created_at) < new Date(earliest.created_at) ? vote : earliest
      ).created_at
    : undefined;

  return { votes, shows, firstVote };
}

async function getFollowingActivity(userId: string, since?: Date): Promise<number> {
  const query = supabase
    .from('user_artists')
    .select('id')
    .eq('user_id', userId);

  if (since) {
    query.gte('created_at', since.toISOString());
  }

  const { data } = await query;
  return data?.length || 0;
}

function getEmptyActivitySummary(): ActivitySummary {
  return {
    last7Days: { votes: 0, showsVotedOn: 0, newArtistsFollowed: 0 },
    last30Days: { votes: 0, showsVotedOn: 0, newArtistsFollowed: 0 },
    allTime: { votes: 0, showsVotedOn: 0, artistsFollowed: 0 }
  };
}

/**
 * Get platform-wide engagement metrics
 */
export async function getPlatformEngagementMetrics(): Promise<UserEngagementMetrics> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      getUserCount(oneDayAgo),
      getUserCount(oneWeekAgo),
      getUserCount(oneMonthAgo)
    ]);

    return {
      dailyActiveUsers: dailyActive,
      weeklyActiveUsers: weeklyActive,
      monthlyActiveUsers: monthlyActive,
      averageSessionDuration: 15, // placeholder
      retentionRate: {
        day1: 75, // placeholder
        day7: 45, // placeholder
        day30: 25  // placeholder
      },
      topFeatures: [
        { feature: 'Voting', usage: 85 },
        { feature: 'Following Artists', usage: 70 },
        { feature: 'Browsing Shows', usage: 90 },
        { feature: 'Search', usage: 60 }
      ]
    };

  } catch (error) {
    console.error('Error getting platform engagement metrics:', error);
    return {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      averageSessionDuration: 0,
      retentionRate: { day1: 0, day7: 0, day30: 0 },
      topFeatures: []
    };
  }
}

async function getUserCount(since: Date): Promise<number> {
  const { count } = await supabase
    .from('votes')
    .select('user_id', { count: 'exact' })
    .gte('created_at', since.toISOString());

  return count || 0;
}
