import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Music, Trophy, TrendingUp, Clock, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';

interface VoteHistory {
  id: string;
  created_at: string;
  setlist_songs: {
    id: string;
    position: number;
    songs: {
      id: string;
      name: string;
      album: string;
    };
    setlists: {
      id: string;
      shows: {
        id: string;
        name: string;
        date: string;
        artists: {
          id: string;
          name: string;
          image_url?: string;
        };
        venues: {
          id: string;
          name: string;
          city: string;
        };
      };
    };
  };
}

interface VotingStats {
  totalVotes: number;
  dailyVotes: number;
  weeklyVotes: number;
  monthlyVotes: number;
  favoriteArtists: Array<{
    id: string;
    name: string;
    image_url?: string;
    vote_count: number;
  }>;
  votingStreak: number;
  accuracyScore: number;
}

export default function UserVotingDashboard() {
  const { user } = useAuth();
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [votingStats, setVotingStats] = useState<VotingStats>({
    totalVotes: 0,
    dailyVotes: 0,
    weeklyVotes: 0,
    monthlyVotes: 0,
    favoriteArtists: [],
    votingStreak: 0,
    accuracyScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (user) {
      fetchVotingData();
    }
  }, [user, timeFilter]);

  const fetchVotingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let dateFilter = '';
      switch (timeFilter) {
        case 'week':
          dateFilter = weekAgo.toISOString();
          break;
        case 'month':
          dateFilter = monthAgo.toISOString();
          break;
        case 'all':
        default:
          dateFilter = '';
      }

      // Fetch vote history with relationships
      const { data: historyData, error: historyError } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          setlist_songs!inner (
            id,
            position,
            songs!inner (
              id,
              name,
              album
            ),
            setlists!inner (
              id,
              shows!inner (
                id,
                name,
                date,
                artists!inner (
                  id,
                  name,
                  image_url
                ),
                venues!inner (
                  id,
                  name,
                  city
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('created_at', dateFilter || '1970-01-01')
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) {
        console.error('Error fetching vote history:', historyError);
        toast.error('Failed to load voting history');
        return;
      }

      setVoteHistory(historyData || []);

      // Fetch voting statistics
      const { data: statsData, error: statsError } = await supabase.rpc('get_user_voting_stats', {
        user_id_param: user.id
      });

      if (statsError) {
        console.error('Error fetching voting stats:', statsError);
      } else {
        setVotingStats(statsData || votingStats);
      }

    } catch (error) {
      console.error('Error fetching voting data:', error);
      toast.error('Failed to load voting data');
    } finally {
      setLoading(false);
    }
  };

  const getVotingStreakBadge = (streak: number) => {
    if (streak >= 30) return { color: 'bg-purple-500', text: '🔥 Legend' };
    if (streak >= 14) return { color: 'bg-yellow-500', text: '⭐ Superstar' };
    if (streak >= 7) return { color: 'bg-green-500', text: '🎯 Regular' };
    if (streak >= 3) return { color: 'bg-blue-500', text: '📈 Active' };
    return { color: 'bg-gray-500', text: '🎵 Fan' };
  };

  const streakBadge = getVotingStreakBadge(votingStats.votingStreak);

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold">{votingStats.totalVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{votingStats.monthlyVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Voting Streak</p>
                <p className="text-2xl font-bold">{votingStats.votingStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold">{votingStats.accuracyScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Level Badge */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Voter Level</h3>
              <Badge className={`${streakBadge.color} text-white`}>
                {streakBadge.text}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Keep voting daily to maintain your streak!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Filter */}
      <div className="flex space-x-2">
        {(['week', 'month', 'all'] as const).map((filter) => (
          <Button
            key={filter}
            variant={timeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter(filter)}
          >
            {filter === 'week' ? 'Last Week' : filter === 'month' ? 'Last Month' : 'All Time'}
          </Button>
        ))}
      </div>

      {/* Recent Voting History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Votes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {voteHistory.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No votes found for the selected period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {voteHistory.map((vote) => (
                <div key={vote.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {vote.setlist_songs.setlists.shows.artists.image_url ? (
                      <img
                        src={vote.setlist_songs.setlists.shows.artists.image_url}
                        alt={vote.setlist_songs.setlists.shows.artists.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Music className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium">{vote.setlist_songs.songs.name}</h4>
                    <p className="text-sm text-gray-600">
                      by {vote.setlist_songs.setlists.shows.artists.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {vote.setlist_songs.setlists.shows.name} • {vote.setlist_songs.setlists.shows.venues.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {format(new Date(vote.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(vote.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
