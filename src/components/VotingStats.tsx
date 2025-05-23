
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface VotingStatsProps {
  setlistId?: string;
}

interface VoteActivity {
  name: string;
  votes: number;
}

// Helper to generate daily data labels for the past week
const generateDayLabels = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const dayLabels = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dayLabels.push(days[date.getDay()]);
  }
  
  return dayLabels;
};

const VotingStats = ({ setlistId }: VotingStatsProps) => {
  const [voteActivity, setVoteActivity] = useState<VoteActivity[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [uniqueVoters, setUniqueVoters] = useState(0);
  const [songCount, setSongCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchVotingStats = async () => {
      if (!setlistId) {
        // If no setlist ID provided, initialize with empty data
        setLoading(false);
        return;
      }
      
      try {
        // Get the setlist songs with votes
        const { data: setlistSongs, error: songsError } = await supabase
          .from('setlist_songs')
          .select('id, votes')
          .eq('setlist_id', setlistId);
          
        if (songsError) {
          console.error('Error fetching setlist songs:', songsError);
          return;
        }
        
        // Calculate total votes and song count
        const totalVotesCount = setlistSongs?.reduce((sum, song) => sum + (song.votes || 0), 0) || 0;
        setTotalVotes(totalVotesCount);
        setSongCount(setlistSongs?.length || 0);
        
        // Get unique voters
        const { data: votes, error: votesError } = await supabase
          .from('votes')
          .select('user_id')
          .in(
            'setlist_song_id', 
            setlistSongs?.map(song => song.id) || []
          );
          
        if (votesError) {
          console.error('Error fetching votes:', votesError);
        } else {
          // Count unique users
          const uniqueUsers = new Set(votes?.map(vote => vote.user_id));
          setUniqueVoters(uniqueUsers.size);
        }
        
        // Generate vote activity data for the chart (past 7 days)
        const dayLabels = generateDayLabels();
        
        // Get votes from the past week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: recentVotes, error: recentVotesError } = await supabase
          .from('votes')
          .select('created_at')
          .in(
            'setlist_song_id', 
            setlistSongs?.map(song => song.id) || []
          )
          .gte('created_at', oneWeekAgo.toISOString());
          
        if (recentVotesError) {
          console.error('Error fetching recent votes:', recentVotesError);
        } else {
          // Group votes by day
          const votesPerDay: Record<string, number> = {};
          dayLabels.forEach(day => { votesPerDay[day] = 0 });
          
          recentVotes?.forEach(vote => {
            const voteDate = new Date(vote.created_at);
            const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][voteDate.getDay()];
            votesPerDay[day] = (votesPerDay[day] || 0) + 1;
          });
          
          // Create chart data
          const chartData = dayLabels.map(day => ({
            name: day,
            votes: votesPerDay[day] || 0
          }));
          
          setVoteActivity(chartData);
        }
      } catch (error) {
        console.error('Error fetching voting stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVotingStats();
  }, [setlistId]);
  
  // If there's no real data yet, use placeholder data for the chart
  const displayData = voteActivity.length > 0 ? voteActivity : [
    { name: "Sun", votes: 0 },
    { name: "Mon", votes: 0 },
    { name: "Tue", votes: 0 },
    { name: "Wed", votes: 0 },
    { name: "Thu", votes: 0 },
    { name: "Fri", votes: 0 },
    { name: "Sat", votes: 0 },
  ];

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">Voting Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData}>
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar
                dataKey="votes"
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-white">{loading ? '-' : totalVotes}</p>
            <p className="text-xs text-gray-400">Total Votes</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{loading ? '-' : uniqueVoters}</p>
            <p className="text-xs text-gray-400">Voters</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{loading ? '-' : songCount}</p>
            <p className="text-xs text-gray-400">Songs</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingStats;
