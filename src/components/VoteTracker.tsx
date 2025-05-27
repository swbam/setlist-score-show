
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface VoteTrackerProps {
  showId: string;
  usedVotes: number;
  maxVotes: number;
}

export default function VoteTracker({ showId, usedVotes, maxVotes }: VoteTrackerProps) {
  const { user } = useAuth();
  const [dailyVotes, setDailyVotes] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const maxDailyVotes = 50;

  useEffect(() => {
    const fetchVoteStats = async () => {
      if (!user) return;

      try {
        // Get today's votes
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: todayCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        // Get total votes
        const { count: totalCount } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setDailyVotes(todayCount || 0);
        setTotalVotes(totalCount || 0);
      } catch (error) {
        console.error('Error fetching vote stats:', error);
      }
    };

    fetchVoteStats();
  }, [user, usedVotes]);

  if (!user) return null;

  const showVotesProgress = (usedVotes / maxVotes) * 100;
  const dailyVotesProgress = (dailyVotes / maxDailyVotes) * 100;

  return (
    <Card className="bg-gray-900/40 border-gray-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center justify-between">
          Vote Status
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            {totalVotes} Total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show Votes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">This Show</span>
            <span className="text-gray-300">{usedVotes}/{maxVotes}</span>
          </div>
          <Progress 
            value={showVotesProgress} 
            className="h-2 bg-gray-700"
          />
          {usedVotes >= maxVotes && (
            <p className="text-orange-400 text-xs">Vote limit reached for this show</p>
          )}
        </div>

        {/* Daily Votes */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Today</span>
            <span className="text-gray-300">{dailyVotes}/{maxDailyVotes}</span>
          </div>
          <Progress 
            value={dailyVotesProgress} 
            className="h-2 bg-gray-700"
          />
          {dailyVotes >= maxDailyVotes && (
            <p className="text-red-400 text-xs">Daily vote limit reached</p>
          )}
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Vote limits help ensure fair participation across all fans
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
