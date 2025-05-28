
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VotingStats {
  totalVotes: number;
  dailyVotes: number;
  showsVoted: number;
  topGenres: string[];
  accuracyScore: number;
}

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
          name: string;
          city: string;
          state?: string;
        };
      };
    };
  };
}

export function UserVotingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<VotingStats>({
    totalVotes: 0,
    dailyVotes: 0,
    showsVoted: 0,
    topGenres: [],
    accuracyScore: 0
  });
  const [recentVotes, setRecentVotes] = useState<VoteHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadVotingData();
    }
  }, [user]);

  const loadVotingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get recent vote history with proper join
      const { data: voteHistory, error: historyError } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          setlist_songs!inner(
            id,
            position,
            songs!inner(
              id,
              name,
              album
            ),
            setlists!inner(
              id,
              shows!inner(
                id,
                name,
                date,
                artists!inner(
                  id,
                  name,
                  image_url
                ),
                venues!inner(
                  name,
                  city,
                  state
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error loading vote history:', historyError);
      } else if (voteHistory) {
        setRecentVotes(voteHistory as VoteHistory[]);
      }

      // Get voting statistics using correct RPC function name
      const { data: userStats, error: statsError } = await supabase.rpc('get_user_vote_stats', {
        show_id_param: '' // Pass empty string for overall stats
      });

      if (statsError) {
        console.error('Error loading voting stats:', statsError);
      } else if (userStats) {
        const statsData = userStats as any;
        setStats({
          totalVotes: statsData.daily_votes_used || 0,
          dailyVotes: statsData.daily_votes_used || 0,
          showsVoted: Math.floor((statsData.show_votes_used || 0) / 10), // Rough estimate
          topGenres: [],
          accuracyScore: 85 // Placeholder
        });
      }

    } catch (error) {
      console.error('Error in loadVotingData:', error);
      toast({
        title: "Error",
        description: "Failed to load voting statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Please log in to view your voting dashboard</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voting Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Shows Voted</p>
                <p className="text-2xl font-bold">{stats.showsVoted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Votes</p>
                <p className="text-2xl font-bold">{stats.dailyVotes}</p>
                <Progress value={(stats.dailyVotes / 50) * 100} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold">{stats.accuracyScore}%</p>
                <Badge variant="outline" className="mt-1">
                  Good Predictor
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Voting Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Voting Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentVotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No voting activity yet</p>
              <p className="text-sm mt-2">Start voting on upcoming shows to see your activity here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentVotes.map((vote) => (
                <div key={vote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{vote.setlist_songs.songs.name}</p>
                    <p className="text-sm text-gray-600">
                      {vote.setlist_songs.setlists.shows.artists.name} • {vote.setlist_songs.setlists.shows.venues.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(vote.setlist_songs.setlists.shows.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(vote.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.location.href = '/search'}>
              Find Shows to Vote On
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/my-artists'}>
              Manage My Artists
            </Button>
            <Button variant="outline" onClick={loadVotingData}>
              Refresh Statistics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
