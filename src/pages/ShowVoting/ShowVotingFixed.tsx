import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Heart, 
  Plus, 
  Music, 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp,
  Loader2,
  ArrowLeft
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

interface Show {
  id: string;
  name: string;
  date: string;
  start_time?: string;
  view_count: number;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
  };
}

interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  votes: number;
  position: number;
  song: {
    id: string;
    name: string;
    album?: string;
    artist_id: string;
    spotify_url?: string;
  };
}

const ShowVotingFixed = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [show, setShow] = useState<Show | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<Set<string>>(new Set());
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [newSongName, setNewSongName] = useState("");
  const [addingSong, setAddingSong] = useState(false);
  const [showAddSong, setShowAddSong] = useState(false);

  // Get or create anonymous user ID
  const getAnonymousUserId = useCallback(() => {
    let anonymousId = localStorage.getItem('anonymous_user_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('anonymous_user_id', anonymousId);
    }
    return anonymousId;
  }, []);

  // Get current user ID (real or anonymous)
  const getCurrentUserId = useCallback(() => {
    return user?.id || getAnonymousUserId();
  }, [user, getAnonymousUserId]);

  // Load show data and setlist
  useEffect(() => {
    const loadShowData = async () => {
      if (!showId) return;

      try {
        setLoading(true);

        // Load show details
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            *,
            artist:artists(id, name, image_url),
            venue:venues(id, name, city, state, country)
          `)
          .eq('id', showId)
          .single();

        if (showError) throw showError;
        setShow(showData);

        // Increment view count
        await supabase.rpc('increment_show_views', { show_id: showId });

        // Load or create setlist
        let { data: setlist } = await supabase
          .from('setlists')
          .select('id')
          .eq('show_id', showId)
          .single();

        if (!setlist) {
          const { data: newSetlist, error: setlistError } = await supabase
            .from('setlists')
            .insert({
              show_id: showId,
              artist_id: showData.artist.id,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (setlistError) throw setlistError;
          setlist = newSetlist;
        }

        // Load setlist songs
        const { data: songs, error: songsError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            song:songs(id, name, album, artist_id, spotify_url)
          `)
          .eq('setlist_id', setlist.id)
          .order('votes', { ascending: false })
          .order('position', { ascending: true });

        if (songsError) throw songsError;
        setSetlistSongs(songs || []);

        // Load user votes
        const currentUserId = getCurrentUserId();
        const voteKey = `votes_${showId}_${currentUserId}`;
        const savedVotes = localStorage.getItem(voteKey);
        if (savedVotes) {
          setUserVotes(new Set(JSON.parse(savedVotes)));
        }

      } catch (error) {
        console.error('Error loading show data:', error);
        toast.error('Failed to load show data');
      } finally {
        setLoading(false);
      }
    };

    loadShowData();
  }, [showId, getCurrentUserId]);

  // Handle voting
  const handleVote = async (setlistSongId: string) => {
    if (votingFor.has(setlistSongId)) return;

    const currentUserId = getCurrentUserId();
    
    // Check if user already voted for this song
    if (userVotes.has(setlistSongId)) {
      toast.error('You already voted for this song');
      return;
    }

    // Check daily vote limit (50 per day)
    const today = new Date().toDateString();
    const dailyVoteKey = `daily_votes_${today}_${currentUserId}`;
    const dailyVotes = JSON.parse(localStorage.getItem(dailyVoteKey) || '[]');
    
    if (dailyVotes.length >= 50) {
      toast.error('Daily vote limit reached (50 votes per day)');
      return;
    }

    // Check show vote limit (10 per show)
    const showVoteKey = `show_votes_${showId}_${currentUserId}`;
    const showVotes = JSON.parse(localStorage.getItem(showVoteKey) || '[]');
    
    if (showVotes.length >= 10) {
      toast.error('Show vote limit reached (10 votes per show)');
      return;
    }

    setVotingFor(prev => new Set([...prev, setlistSongId]));

    try {
      // Submit vote to database
      const { error } = await supabase.rpc('vote_for_song_anonymous', {
        p_setlist_song_id: setlistSongId,
        p_user_id: currentUserId,
        p_show_id: showId
      });

      if (error) throw error;

      // Update local state
      setUserVotes(prev => new Set([...prev, setlistSongId]));
      setSetlistSongs(prev => prev.map(song => 
        song.id === setlistSongId 
          ? { ...song, votes: song.votes + 1 }
          : song
      ));

      // Save to localStorage
      const updatedUserVotes = [...userVotes, setlistSongId];
      const voteKey = `votes_${showId}_${currentUserId}`;
      localStorage.setItem(voteKey, JSON.stringify(updatedUserVotes));

      // Update daily and show vote counts
      const updatedDailyVotes = [...dailyVotes, { songId: setlistSongId, timestamp: new Date().toISOString() }];
      const updatedShowVotes = [...showVotes, { songId: setlistSongId, timestamp: new Date().toISOString() }];
      
      localStorage.setItem(dailyVoteKey, JSON.stringify(updatedDailyVotes));
      localStorage.setItem(showVoteKey, JSON.stringify(updatedShowVotes));

      toast.success('Vote recorded!');

    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error(error.message || 'Failed to vote');
    } finally {
      setVotingFor(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
    }
  };

  // Handle adding a new song
  const handleAddSong = async () => {
    if (!newSongName.trim() || !show) return;

    const currentUserId = getCurrentUserId();
    
    // Check if user has already added a song to this show
    const addedSongKey = `added_song_${showId}_${currentUserId}`;
    const hasAddedSong = localStorage.getItem(addedSongKey);
    
    if (hasAddedSong) {
      toast.error('You can only add one song per show');
      return;
    }

    setAddingSong(true);

    try {
      // Get setlist ID
      const { data: setlist } = await supabase
        .from('setlists')
        .select('id')
        .eq('show_id', showId)
        .single();

      if (!setlist) throw new Error('Setlist not found');

      // Create or find the song
      let { data: song, error: songError } = await supabase
        .from('songs')
        .select('id')
        .eq('name', newSongName.trim())
        .eq('artist_id', show.artist.id)
        .single();

      if (!song) {
        const { data: newSong, error: createError } = await supabase
          .from('songs')
          .insert({
            name: newSongName.trim(),
            artist_id: show.artist.id,
            album: 'Fan Request'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        song = newSong;
      }

      // Add to setlist
      const nextPosition = setlistSongs.length + 1;
      const { data: setlistSong, error: setlistError } = await supabase
        .from('setlist_songs')
        .insert({
          setlist_id: setlist.id,
          song_id: song.id,
          position: nextPosition,
          votes: 1 // Start with 1 vote from the person who added it
        })
        .select(`
          *,
          song:songs(id, name, album, artist_id, spotify_url)
        `)
        .single();

      if (setlistError) throw setlistError;

      // Update local state
      setSetlistSongs(prev => [...prev, setlistSong]);
      setNewSongName("");
      setShowAddSong(false);

      // Mark that user has added a song
      localStorage.setItem(addedSongKey, 'true');

      toast.success('Song added to setlist!');

    } catch (error: any) {
      console.error('Error adding song:', error);
      toast.error(error.message || 'Failed to add song');
    } finally {
      setAddingSong(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-4xl px-4 pt-20 pb-32 md:pb-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="text-white text-lg ml-3">Loading show...</span>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-4xl px-4 pt-20 pb-32 md:pb-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  const totalVotes = setlistSongs.reduce((sum, song) => sum + song.votes, 0);
  const currentUserId = getCurrentUserId();
  const today = new Date().toDateString();
  const dailyVoteKey = `daily_votes_${today}_${currentUserId}`;
  const showVoteKey = `show_votes_${showId}_${currentUserId}`;
  const addedSongKey = `added_song_${showId}_${currentUserId}`;
  
  const dailyVotes = JSON.parse(localStorage.getItem(dailyVoteKey) || '[]');
  const showVotes = JSON.parse(localStorage.getItem(showVoteKey) || '[]');
  const hasAddedSong = localStorage.getItem(addedSongKey);

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="container mx-auto max-w-4xl px-4 pt-20 pb-32 md:pb-12">
        {/* Show Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              {show.artist.image_url && (
                <img 
                  src={show.artist.image_url} 
                  alt={show.artist.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">{show.name}</h1>
                <p className="text-lg text-gray-300 mb-2">{show.artist.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(show.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {show.venue.name}, {show.venue.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {show.view_count} views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Voting Stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-gray-300">
                <TrendingUp className="w-3 h-3 mr-1" />
                {totalVotes} total votes
              </Badge>
              <Badge variant="outline" className="text-gray-300">
                <Music className="w-3 h-3 mr-1" />
                {setlistSongs.length} songs
              </Badge>
            </div>
            <div className="text-sm text-gray-400">
              Daily: {dailyVotes.length}/50 • Show: {showVotes.length}/10
            </div>
          </div>
        </div>

        {/* Add Song Section */}
        {!hasAddedSong && (
          <Card className="mb-6 bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              {!showAddSong ? (
                <Button 
                  onClick={() => setShowAddSong(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add a Song to This Setlist
                </Button>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Add a Song</h3>
                  <div className="flex gap-2">
                    <Input
                      value={newSongName}
                      onChange={(e) => setNewSongName(e.target.value)}
                      placeholder="Song name..."
                      className="flex-1 bg-gray-800 border-gray-600 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSong()}
                    />
                    <Button 
                      onClick={handleAddSong}
                      disabled={!newSongName.trim() || addingSong}
                    >
                      {addingSong ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowAddSong(false);
                        setNewSongName("");
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    You can add one song per show. Other fans can vote for your suggestion!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Setlist Songs */}
        <div className="space-y-3">
          {setlistSongs.length === 0 ? (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-8 text-center">
                <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No songs in the setlist yet</p>
                <p className="text-sm text-gray-500">
                  Be the first to add a song that you'd like to hear!
                </p>
              </CardContent>
            </Card>
          ) : (
            setlistSongs.map((setlistSong, index) => {
              const hasVoted = userVotes.has(setlistSong.id);
              const isVoting = votingFor.has(setlistSong.id);
              
              return (
                <Card key={setlistSong.id} className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl font-bold text-gray-500 w-8">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{setlistSong.song.name}</h3>
                          {setlistSong.song.album && (
                            <p className="text-sm text-gray-400">{setlistSong.song.album}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white font-semibold">{setlistSong.votes}</div>
                          <div className="text-xs text-gray-400">votes</div>
                        </div>
                        
                        <Button
                          onClick={() => handleVote(setlistSong.id)}
                          disabled={hasVoted || isVoting || dailyVotes.length >= 50 || showVotes.length >= 10}
                          variant={hasVoted ? "secondary" : "default"}
                          size="sm"
                          className={hasVoted ? "bg-red-900 hover:bg-red-800" : ""}
                        >
                          {isVoting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Heart className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
                              {hasVoted ? 'Voted' : 'Vote'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ShowVotingFixed;
