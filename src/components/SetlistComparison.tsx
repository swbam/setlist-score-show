
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, CheckCircle, XCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SetlistComparisonProps {
  showId: string;
  onClose?: () => void;
}

interface ComparisonData {
  fanVoted: Array<{ song_name: string; votes: number; position: number }>;
  actualPlayed: Array<{ song_name: string; position: number }>;
  matchPercentage: number;
  totalMatches: number;
}

const SetlistComparison: React.FC<SetlistComparisonProps> = ({ showId, onClose }) => {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState<any>(null);

  useEffect(() => {
    fetchComparisonData();
  }, [showId]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      
      // Get show details
      const { data: show } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(name, image_url),
          venue:venues(name, city, state)
        `)
        .eq('id', showId)
        .single();
      
      if (show) {
        setShowDetails(show);
      }

      // Get fan-voted setlist
      const { data: fanSetlist } = await supabase
        .from('setlists')
        .select(`
          setlist_songs(
            votes,
            position,
            song:songs(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      // Get actual played setlist
      const { data: playedSetlist } = await supabase
        .from('played_setlists')
        .select(`
          played_setlist_songs(
            position,
            song:songs(name)
          )
        `)
        .eq('show_id', showId)
        .single();

      if (fanSetlist && playedSetlist) {
        const fanVoted = fanSetlist.setlist_songs
          .map((item: any) => ({
            song_name: item.song.name,
            votes: item.votes,
            position: item.position
          }))
          .sort((a, b) => b.votes - a.votes) // Sort by votes
          .slice(0, 20); // Top 20 most voted

        const actualPlayed = playedSetlist.played_setlist_songs
          .map((item: any) => ({
            song_name: item.song.name,
            position: item.position
          }))
          .sort((a, b) => a.position - b.position); // Sort by position

        // Calculate matches
        const fanSongNames = fanVoted.map(s => s.song_name.toLowerCase());
        const playedSongNames = actualPlayed.map(s => s.song_name.toLowerCase());
        const matches = fanSongNames.filter(song => playedSongNames.includes(song));
        const matchPercentage = Math.round((matches.length / Math.max(fanSongNames.length, playedSongNames.length)) * 100);

        setComparison({
          fanVoted,
          actualPlayed,
          matchPercentage,
          totalMatches: matches.length
        });
      } else {
        toast.error("Setlist comparison data not available for this show");
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error("Failed to load setlist comparison");
    } finally {
      setLoading(false);
    }
  };

  const isMatched = (songName: string, isInFanList: boolean) => {
    if (!comparison) return false;
    const songLower = songName.toLowerCase();
    
    if (isInFanList) {
      return comparison.actualPlayed.some(s => s.song_name.toLowerCase() === songLower);
    } else {
      return comparison.fanVoted.some(s => s.song_name.toLowerCase() === songLower);
    }
  };

  const handleShare = () => {
    if (navigator.share && comparison && showDetails) {
      navigator.share({
        title: `Setlist Prediction Results`,
        text: `Fans predicted ${comparison.matchPercentage}% of ${showDetails.artist.name}'s setlist correctly!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-800 rounded"></div>
            <div className="h-96 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison || !showDetails) {
    return (
      <div className="text-center py-16">
        <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No Comparison Available</h3>
        <p className="text-gray-400">
          This show hasn't occurred yet or the actual setlist hasn't been imported.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Setlist Prediction Results</h1>
        <div className="text-gray-300">
          <h2 className="text-xl">{showDetails.artist.name}</h2>
          <p>{showDetails.venue.name} • {showDetails.venue.city}, {showDetails.venue.state}</p>
          <p>{new Date(showDetails.date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Match Stats */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-cyan-500">{comparison.matchPercentage}%</div>
              <div className="text-gray-400">Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{comparison.totalMatches}</div>
              <div className="text-gray-400">Songs Matched</div>
            </div>
            <div>
              <Button onClick={handleShare} className="bg-cyan-600 hover:bg-cyan-700">
                <Share2 className="h-4 w-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fan Voted */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-cyan-500">Fan Predictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comparison.fanVoted.map((song, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isMatched(song.song_name, true) 
                    ? 'bg-green-900/30 border border-green-700' 
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isMatched(song.song_name, true) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-white">{song.song_name}</span>
                </div>
                <Badge variant="secondary">{song.votes} votes</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actual Played */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-yellow-500">Actual Setlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comparison.actualPlayed.map((song, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isMatched(song.song_name, false) 
                    ? 'bg-green-900/30 border border-green-700' 
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isMatched(song.song_name, false) ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Music className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="text-white">{song.song_name}</span>
                </div>
                <Badge variant="outline">#{song.position}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {onClose && (
        <div className="text-center">
          <Button variant="outline" onClick={onClose}>
            Back to Show
          </Button>
        </div>
      )}
    </div>
  );
};

export default SetlistComparison;
