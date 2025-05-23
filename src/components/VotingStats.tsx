
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ThumbsUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMobile } from "@/context/MobileContext";

interface VotingStatsProps {
  setlistId: string;
}

interface Stats {
  totalVotes: number;
  uniqueVoters: number;
  lastVoteTime: string | null;
  avgVotesPerSong: number;
}

// Helper function for time ago calculation
const formatTimeAgo = (timestamp: string | null) => {
  if (!timestamp) return 'No votes yet';
  
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  type TimeInterval = {
    [key: string]: number;
  }

  const intervals: TimeInterval = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const counter = Math.floor(seconds / secondsInUnit);
    if (counter > 0) {
      return `${counter} ${unit}${counter === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

const VotingStats = ({ setlistId }: VotingStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    totalVotes: 0,
    uniqueVoters: 0,
    lastVoteTime: null,
    avgVotesPerSong: 0
  });
  const [loading, setLoading] = useState(true);
  const { isMobile } = useMobile();

  useEffect(() => {
    async function fetchStats() {
      if (!setlistId) {
        console.log("No setlistId provided to VotingStats");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get total votes and songs count
        const { data: songsData, error: songsError } = await supabase
          .from('setlist_songs')
          .select('votes')
          .eq('setlist_id', setlistId);
          
        if (songsError) {
          console.error("Error fetching setlist songs:", songsError);
          throw songsError;
        }
        
        const totalVotes = songsData ? songsData.reduce((sum, song) => sum + (song.votes || 0), 0) : 0;
        const songCount = songsData ? songsData.length : 1;
        
        // Get unique voter count
        const { count, error: countError } = await supabase
          .from('votes')
          .select('user_id', { count: 'exact', head: true })
          .eq('setlist_id', setlistId);
        
        if (countError) {
          console.error("Error counting unique voters:", countError);
          throw countError;
        }
        
        // Get last vote time
        const { data: lastVoteData, error: timeError } = await supabase
          .from('votes')
          .select('created_at')
          .eq('setlist_id', setlistId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (timeError) {
          console.error("Error fetching last vote time:", timeError);
          throw timeError;
        }
          
        setStats({
          totalVotes,
          uniqueVoters: count || 0,
          lastVoteTime: lastVoteData && lastVoteData.length > 0 ? lastVoteData[0].created_at : null,
          avgVotesPerSong: songCount > 0 ? totalVotes / songCount : 0
        });
      } catch (error) {
        console.error("Error fetching voting stats:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
    
    // Set up real-time subscription for votes
    const channel = supabase
      .channel(`voting-stats-${setlistId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'votes', 
          filter: `setlist_id=eq.${setlistId}` 
        },
        () => fetchStats()
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId]);
  
  return (
    <Card className={`bg-yellow-metal-950/40 border-yellow-metal-800/50 ${isMobile ? 'mx-2 mb-20' : ''}`}>
      <CardContent className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Voting Stats</h3>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-5 bg-yellow-metal-900 rounded animate-pulse w-2/3"></div>
            <div className="h-5 bg-yellow-metal-900 rounded animate-pulse w-1/2"></div>
            <div className="h-5 bg-yellow-metal-900 rounded animate-pulse w-3/4"></div>
          </div>
        ) : (
          <ul className="space-y-4">
            <li className="flex items-center text-yellow-metal-200">
              <ThumbsUp className="h-4 w-4 mr-3 text-yellow-metal-300" />
              <span className="text-sm">
                {stats.totalVotes} total {stats.totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </li>
            <li className="flex items-center text-yellow-metal-200">
              <Users className="h-4 w-4 mr-3 text-yellow-metal-300" />
              <span className="text-sm">
                {stats.uniqueVoters} {stats.uniqueVoters === 1 ? 'person has' : 'people have'} voted
              </span>
            </li>
            <li className="flex items-center text-yellow-metal-200">
              <Clock className="h-4 w-4 mr-3 text-yellow-metal-300" />
              <span className="text-sm">
                Last vote: {formatTimeAgo(stats.lastVoteTime)}
              </span>
            </li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default VotingStats;
