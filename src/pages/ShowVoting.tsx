import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getShowDetails, getSetlistSongs } from '../services/shows';
import { subscribeToSetlistVotes } from '../services/realtime';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function ShowVoting() {
  const { showId } = useParams();
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  const { data: show } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => supabase.from('shows').select('*').eq('id', showId).single()
  });

  const { data: setlistSongs } = useQuery({
    queryKey: ['setlist-songs', showId],
    queryFn: () => getSetlistSongs(showId)
  });

  // Add realtime subscription
  useEffect(() => {
    if (!setlist?.id) return;

    const unsubscribe = subscribeToSetlistVotes(setlist.id, (payload) => {
      // Update local state when votes change
      if (payload.new) {
        setLocalVotes(prev => ({
          ...prev,
          [payload.new.id]: payload.new.votes
        }));
      }
    });

    return () => unsubscribe();
  }, [setlist?.id]);

  // Load user's existing votes
  useEffect(() => {
    const loadUserVotes = async () => {
      if (!user || !setlist) return;

      const { data } = await supabase
        .from('votes')
        .select('setlist_song_id')
        .eq('user_id', user.id)
        .in('setlist_song_id', setlistSongs.map(s => s.id));

      if (data) {
        setUserVotes(new Set(data.map(v => v.setlist_song_id)));
      }
    };

    loadUserVotes();
  }, [user, setlist, setlistSongs]);

  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }

    if (userVotes.has(setlistSongId)) {
      toast.error('You already voted for this song');
      return;
    }

    // Optimistic update
    setLocalVotes(prev => ({
      ...prev,
      [setlistSongId]: (prev[setlistSongId] || 0) + 1
    }));
    setUserVotes(prev => new Set([...prev, setlistSongId]));

    try {
      const { error } = await supabase.rpc('vote_for_song', {
        p_user_id: user.id,
        p_setlist_song_id: setlistSongId
      });

      if (error) throw error;
      toast.success('Vote recorded!');
    } catch (error: any) {
      // Revert optimistic update
      setLocalVotes(prev => ({
        ...prev,
        [setlistSongId]: (prev[setlistSongId] || 1) - 1
      }));
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
      
      toast.error(error.message || 'Failed to vote');
    }
  };

  const handleCreateSetlist = async () => {
    if (!show || !songs.length) return;

    try {
      const initialSongs = songs.slice(0, 20).map((song, index) => ({
        song_id: song.id,
        position: index + 1,
        artist_id: show.artist_id // Add artist_id here
      }));

      // ...existing code...
    } catch (error) {
      console.error('Error creating setlist:', error);
    }
  };

  if (!show || !setlistSongs) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{show.name}</h1>
      <p className="text-lg text-muted-foreground mb-8">
        {new Date(show.date).toLocaleString()} - {show.venue.name}, {show.venue.city}
      </p>
      
      {setlistSongs.map((setlistSong) => {
        const currentVotes = localVotes[setlistSong.id] ?? setlistSong.votes;
        const hasVoted = userVotes.has(setlistSong.id);
        
        return (
          <Card key={setlistSong.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-muted-foreground">
                  {setlistSong.position}
                </span>
                <div>
                  <h3 className="font-semibold">{setlistSong.song?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {setlistSong.song?.album}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold">{currentVotes} votes</span>
                <Button
                  variant={hasVoted ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleVote(setlistSong.id)}
                  disabled={hasVoted}
                >
                  {hasVoted ? 'Voted' : 'Vote'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* ...existing code... */}
    </div>
  );
}