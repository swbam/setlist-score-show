import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, HeartOff, Users, Clock, AlertCircle, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeVotingEnhanced } from '@/hooks/useRealtimeVotingEnhanced';
import type { VoteResponse, VoteLimits, SetlistSong, Song } from '@/types/database';

// Types imported from @/types/database

interface VotingInterfaceEnhancedProps {
  setlistId: string;
  showId: string;
  songs: SetlistSong[];
  onVoteUpdate?: (songId: string, newVoteCount: number) => void;
}

export const VotingInterfaceEnhanced = React.memo(({ 
  setlistId, 
  showId, 
  songs, 
  onVoteUpdate 
}: VotingInterfaceEnhancedProps) => {
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [voteLimits, setVoteLimits] = useState<VoteLimits>({
    dailyVotesUsed: 0,
    dailyVotesRemaining: 50,
    showVotesUsed: 0,
    showVotesRemaining: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const { 
    voteCounts, 
    isConnected, 
    optimisticVoteUpdate, 
    revertVoteUpdate 
  } = useRealtimeVotingEnhanced(setlistId);

  useEffect(() => {
    loadUserVotes();
    loadVoteLimits();
  }, [setlistId, showId]);

  const loadUserVotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('votes')
        .select(`
          setlist_song_id,
          setlist_songs!inner(setlist_id)
        `)
        .eq('user_id', user.id)
        .eq('setlist_songs.setlist_id', setlistId);

      if (error) throw error;

      const voteSet = new Set(data?.map(vote => vote.setlist_song_id) || []);
      setUserVotes(voteSet);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  const loadVoteLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get daily votes
      const { data: dailyVotes, error: dailyError } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      if (dailyError) throw dailyError;

      // Get show votes
      const { data: showVotes, error: showError } = await supabase
        .from('votes')
        .select(`
          id,
          setlist_songs!inner(
            setlist_id,
            setlists!inner(show_id)
          )
        `)
        .eq('user_id', user.id)
        .eq('setlist_songs.setlists.show_id', showId);

      if (showError) throw showError;

      const dailyUsed = dailyVotes?.length || 0;
      const showUsed = showVotes?.length || 0;

      setVoteLimits({
        dailyVotesUsed: dailyUsed,
        dailyVotesRemaining: Math.max(0, 50 - dailyUsed),
        showVotesUsed: showUsed,
        showVotesRemaining: Math.max(0, 10 - showUsed)
      });
    } catch (error) {
      console.error('Error loading vote limits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (setlistSongId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to vote",
          variant: "destructive"
        });
        return;
      }

      const hasVoted = userVotes.has(setlistSongId);
      
      if (hasVoted) {
        toast({
          title: "Already Voted",
          description: "You've already voted for this song",
          variant: "destructive"
        });
        return;
      }

      if (voteLimits.dailyVotesRemaining <= 0) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily voting limit (50 votes)",
          variant: "destructive"
        });
        return;
      }

      if (voteLimits.showVotesRemaining <= 0) {
        toast({
          title: "Show Limit Reached",
          description: "You've reached your voting limit for this show (10 votes)",
          variant: "destructive"
        });
        return;
      }

      // Optimistic update
      optimisticVoteUpdate(setlistSongId);
      setUserVotes(prev => new Set([...prev, setlistSongId]));
      setVoteLimits(prev => ({
        ...prev,
        dailyVotesUsed: prev.dailyVotesUsed + 1,
        dailyVotesRemaining: prev.dailyVotesRemaining - 1,
        showVotesUsed: prev.showVotesUsed + 1,
        showVotesRemaining: prev.showVotesRemaining - 1
      }));

      // Call database function
      const { data, error } = await supabase.rpc('vote_for_song', {
        p_user_id: user.id,
        p_setlist_song_id: setlistSongId
      });

      if (error) throw error;

      // Parse JSON response from database function
      const response = typeof data === 'string' ? JSON.parse(data) : data;

      if (!response || !response.success) {
        // Revert optimistic update
        revertVoteUpdate(setlistSongId);
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(setlistSongId);
          return newSet;
        });
        setVoteLimits(prev => ({
          ...prev,
          dailyVotesUsed: prev.dailyVotesUsed - 1,
          dailyVotesRemaining: prev.dailyVotesRemaining + 1,
          showVotesUsed: prev.showVotesUsed - 1,
          showVotesRemaining: prev.showVotesRemaining + 1
        }));

        toast({
          title: "Vote Failed",
          description: response.error || "Unknown error",
          variant: "destructive"
        });
        return;
      }

      // Update with server response
      setVoteLimits({
        dailyVotesUsed: response.daily_votes_used || 0,
        dailyVotesRemaining: response.daily_votes_remaining || 0,
        showVotesUsed: response.show_votes_used || 0,
        showVotesRemaining: response.show_votes_remaining || 0
      });

      toast({
        title: "Vote Recorded!",
        description: `Your vote has been counted`,
      });

      onVoteUpdate?.(setlistSongId, response.votes || 0);

    } catch (error) {
      console.error('Error voting:', error);
      
      // Revert optimistic update
      revertVoteUpdate(setlistSongId);
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });

      toast({
        title: "Vote Failed",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      const aVotes = voteCounts[a.id] || a.votes;
      const bVotes = voteCounts[b.id] || b.votes;
      return bVotes - aVotes;
    });
  }, [songs, voteCounts]);

  return (
    <div className="space-y-6">
      {/* Vote Limits Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Voting Status
            {!isConnected && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Votes</span>
                <span>{voteLimits.dailyVotesUsed}/50</span>
              </div>
              <Progress 
                value={(voteLimits.dailyVotesUsed / 50) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                {voteLimits.dailyVotesRemaining} votes remaining today
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Show Votes</span>
                <span>{voteLimits.showVotesUsed}/10</span>
              </div>
              <Progress 
                value={(voteLimits.showVotesUsed / 10) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-600 mt-1">
                {voteLimits.showVotesRemaining} votes remaining for this show
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Songs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Vote for Songs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedSongs.map((song, index) => {
              const hasVoted = userVotes.has(song.id);
              const currentVotes = voteCounts[song.id] || song.votes;
              const canVote = !hasVoted && 
                           voteLimits.dailyVotesRemaining > 0 && 
                           voteLimits.showVotesRemaining > 0;

              return (
                <div 
                  key={song.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    hasVoted 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-500 w-8">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{song.songs.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-3 w-3" />
                        {currentVotes} votes
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {hasVoted && (
                      <Badge variant="default" className="gap-1">
                        <Heart className="h-3 w-3 fill-current" />
                        Voted
                      </Badge>
                    )}
                    
                    <Button
                      onClick={() => handleVote(song.id)}
                      disabled={!canVote}
                      variant={hasVoted ? "outline" : "default"}
                      size="sm"
                      className="gap-2"
                    >
                      {hasVoted ? (
                        <>
                          <HeartOff className="h-4 w-4" />
                          Voted
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4" />
                          Vote
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {songs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No songs available for voting yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});