
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, XCircle, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface SetlistComparisonProps {
  showId: string;
  onClose: () => void;
}

interface Song {
  id: string;
  name: string;
  album: string;
}

interface SetlistSong {
  position: number;
  song: Song;
}

interface PlayedSong {
  position: number;
  song: Song;
}

const SetlistComparison = ({ showId, onClose }: SetlistComparisonProps) => {
  const [votedSetlist, setVotedSetlist] = useState<SetlistSong[]>([]);
  const [playedSetlist, setPlayedSetlist] = useState<PlayedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState<any>(null);
  const [matchPercentage, setMatchPercentage] = useState(0);

  useEffect(() => {
    fetchComparisonData();
  }, [showId]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);

      // Fetch show details
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          id,
          name,
          date,
          artists!shows_artist_id_fkey (
            id,
            name,
            image_url
          ),
          venues!shows_venue_id_fkey (
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('id', showId)
        .single();

      if (showError) throw showError;
      setShowData(show);

      // Fetch voted setlist
      const { data: setlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (setlist) {
        const { data: votedSongs } = await supabase
          .from('setlist_songs')
          .select(`
            position,
            songs!setlist_songs_song_id_fkey (
              id,
              name,
              album
            )
          `)
          .eq('setlist_id', setlist.id)
          .order('votes', { ascending: false })
          .limit(20);

        if (votedSongs) {
          setVotedSetlist(votedSongs.map((item, index) => ({
            position: index + 1,
            song: item.songs as Song
          })));
        }
      }

      // Fetch played setlist
      const { data: playedSetlistData } = await supabase
        .from('played_setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (playedSetlistData) {
        const { data: playedSongs } = await supabase
          .from('played_setlist_songs')
          .select(`
            position,
            songs!played_setlist_songs_song_id_fkey (
              id,
              name,
              album
            )
          `)
          .eq('played_setlist_id', playedSetlistData.id)
          .order('position', { ascending: true });

        if (playedSongs) {
          setPlayedSetlist(playedSongs.map(item => ({
            position: item.position,
            song: item.songs as Song
          })));
        }
      }

    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('Failed to load setlist comparison');
    } finally {
      setLoading(false);
    }
  };

  // Calculate match percentage
  useEffect(() => {
    if (votedSetlist.length > 0 && playedSetlist.length > 0) {
      const votedSongIds = new Set(votedSetlist.map(item => item.song.id));
      const playedSongIds = new Set(playedSetlist.map(item => item.song.id));
      
      const matches = Array.from(votedSongIds).filter(id => playedSongIds.has(id));
      const percentage = Math.round((matches.length / Math.max(votedSetlist.length, playedSetlist.length)) * 100);
      
      setMatchPercentage(percentage);
    }
  }, [votedSetlist, playedSetlist]);

  const isSongMatched = (songId: string): boolean => {
    const playedSongIds = new Set(playedSetlist.map(item => item.song.id));
    return playedSongIds.has(songId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Loading Comparison...</h1>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="h-12 bg-gray-800 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!showData) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
        <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Setlist Comparison</h1>
          <div className="text-gray-400">
            <p>{(showData.artists as any)?.name} • {(showData.venues as any)?.name}</p>
            <p>{new Date(showData.date).toLocaleDateString()}</p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Match Statistics */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Prediction Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold text-cyan-400">
              {matchPercentage}%
            </div>
            <div className="text-gray-400">
              <p>Fan predictions matched the actual setlist</p>
              <p className="text-sm">
                {votedSetlist.filter(item => isSongMatched(item.song.id)).length} of {Math.max(votedSetlist.length, playedSetlist.length)} songs matched
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setlist Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan-Voted Setlist */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Music className="h-5 w-5 mr-2 text-cyan-400" />
              Fan-Voted Setlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {votedSetlist.length > 0 ? (
                votedSetlist.map((item) => (
                  <div
                    key={item.song.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isSongMatched(item.song.id) 
                        ? 'bg-green-900/20 border border-green-700' 
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 font-mono text-sm w-6">
                        {item.position}
                      </span>
                      <div>
                        <p className="text-white font-medium">{item.song.name}</p>
                        <p className="text-gray-400 text-sm">{item.song.album}</p>
                      </div>
                    </div>
                    <div>
                      {isSongMatched(item.song.id) ? (
                        <Badge variant="outline" className="border-green-600 text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Match
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-600 text-red-400">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Match
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No fan votes recorded for this show
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actual Played Setlist */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Music className="h-5 w-5 mr-2 text-green-400" />
              Actual Setlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playedSetlist.length > 0 ? (
                playedSetlist.map((item) => (
                  <div
                    key={item.song.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 font-mono text-sm w-6">
                        {item.position}
                      </span>
                      <div>
                        <p className="text-white font-medium">{item.song.name}</p>
                        <p className="text-gray-400 text-sm">{item.song.album}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">
                  Actual setlist not yet available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onClose}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          Back to Show
        </Button>
      </div>
    </div>
  );
};

export default SetlistComparison;
