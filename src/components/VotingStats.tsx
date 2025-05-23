
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface VotingStatsProps {
  setlistId: string;
}

interface VoteData {
  songName: string;
  votes: number;
  color?: string;
}

export default function VotingStats({ setlistId }: VotingStatsProps) {
  const [loading, setLoading] = useState(true);
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchVotingStats();
  }, [setlistId]);

  const fetchVotingStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          id,
          votes,
          song:songs(id, name)
        `)
        .eq('setlist_id', setlistId)
        .order('votes', { ascending: false });
        
      if (error) {
        console.error('Error fetching voting stats:', error);
        return;
      }
      
      // Process data for chart with proper type safety
      const chartData: VoteData[] = data.map((item: any) => ({
        songName: item.song?.name || 'Unknown Song',
        votes: item.votes,
        // Generate color based on votes (more votes = more intense color)
        color: `rgba(34, 211, 238, ${Math.min(0.3 + item.votes * 0.1, 1)})`
      }));
      
      // Calculate total votes
      const total = data.reduce((sum: number, item: any) => sum + item.votes, 0);
      
      setVoteData(chartData);
      setTotalVotes(total);
    } catch (error) {
      console.error('Error in fetchVotingStats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for the chart that explicitly types the parameters
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-2 rounded">
          <p className="text-white font-medium">{payload[0].payload.songName}</p>
          <p className="text-cyan-400">{`${payload[0].value} votes`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardContent className="p-6 flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (voteData.length === 0 || totalVotes === 0) {
    return (
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white mb-0">Voting Stats</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="text-center py-8 text-gray-400">
            No votes have been cast for this setlist yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/40 border-gray-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white mb-0">Voting Stats</CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="text-center mb-4">
          <span className="text-cyan-400 text-lg font-bold">{totalVotes}</span>
          <span className="text-gray-300 ml-1">total votes</span>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={voteData.slice(0, 8)} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 'dataMax + 2']} />
              <YAxis 
                type="category" 
                dataKey="songName"
                width={120}
                tick={{ fill: '#e5e7eb', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="votes" 
                fill="#22d3ee"
                background={{ fill: '#374151' }}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
