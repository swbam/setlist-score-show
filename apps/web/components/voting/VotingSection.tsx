'use client'

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteButton } from './VoteButton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, AlertCircle, Users, Share, Users2, Music, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface Song {
  id: string;
  name: string;
  album: string;
  duration_ms: number;
  spotify_url?: string;
}

interface SetlistSong {
  id: string;
  position: number;
  votes: number;
  hasVoted: boolean;
  canVote: boolean;
  notes?: string;
  song: {
    id: string;
    name: string;
    album?: string;
    duration?: number;
    popularity?: number;
    previewUrl?: string;
    spotifyUrl?: string;
  };
}

interface CatalogSong {
  id: string;
  title: string;
  album?: string;
}

interface VotingSectionProps {
  showId: string;
  songs: SetlistSong[];
  showData: any;
  userVotes: any[];
  onVote: (songId: string, setlistSongId: string) => Promise<void>;
}

type SortOption = 'votes' | 'position' | 'name' | 'popularity';

export function VotingSection({ showId, songs, showData, userVotes, onVote }: VotingSectionProps) {
  const [sortedSongs, setSortedSongs] = useState<SetlistSong[]>(songs);
  const [sortBy, setSortBy] = useState<SortOption>('votes');
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVoteSet, setUserVoteSet] = useState<Set<string>>(new Set());
  const [totalVotes, setTotalVotes] = useState(0);
  const supabase = createClientComponentClient();

  // Initialize vote counts and user votes
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    let total = 0;
    
    songs.forEach(song => {
      initialCounts[song.id] = song.votes;
      total += song.votes;
    });
    
    setVoteCounts(initialCounts);
    setTotalVotes(total);
    setUserVoteSet(new Set(userVotes.map(v => v.setlist_song_id)));
  }, [songs, userVotes]);

  // Sort songs based on current sort option
  useEffect(() => {
    const sorted = [...songs].sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          const aVotes = voteCounts[a.id] || a.votes;
          const bVotes = voteCounts[b.id] || b.votes;
          return bVotes - aVotes;
        case 'position':
          return a.position - b.position;
        case 'name':
          return a.song.name.localeCompare(b.song.name);
        case 'popularity':
          return (b.song.popularity || 0) - (a.song.popularity || 0);
        default:
          return 0;
      }
    });
    setSortedSongs(sorted);
  }, [songs, sortBy, voteCounts]);

  const handleVote = async (songId: string, setlistSongId: string) => {
    setIsVoting(setlistSongId);
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          showId,
          setlistSongId,
          isAnonymous: false
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state optimistically
        setVoteCounts(prev => ({
          ...prev,
          [setlistSongId]: result.newVoteCount
        }));
        
        setUserVoteSet(prev => new Set([...prev, setlistSongId]));
        setTotalVotes(prev => prev + 1);
      } else {
        throw new Error(result.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote failed:', error);
      // You could add a toast notification here
    } finally {
      setIsVoting(null);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTopSongs = () => {
    return [...sortedSongs]
      .sort((a, b) => (voteCounts[b.id] || b.votes) - (voteCounts[a.id] || a.votes))
      .slice(0, 3);
  };

  return (
    <div className="space-y-8">
      {/* Voting Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalVotes}</div>
          <div className="text-sm text-muted-foreground">Total Votes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{songs.length}</div>
          <div className="text-sm text-muted-foreground">Songs</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{userVoteSet.size}</div>
          <div className="text-sm text-muted-foreground">Your Votes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {Math.max(0, getTopSongs()[0] ? (voteCounts[getTopSongs()[0].id] || getTopSongs()[0].votes) : 0)}
          </div>
          <div className="text-sm text-muted-foreground">Top Song</div>
        </Card>
      </div>

      {/* Top 3 Songs Highlight */}
      {getTopSongs().length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Most Wanted Songs
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {getTopSongs().map((song, index) => (
              <div 
                key={song.id}
                className={cn(
                  "p-4 rounded-lg border",
                  index === 0 && "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
                  index === 1 && "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700",
                  index === 2 && "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <Badge variant="secondary">
                    {voteCounts[song.id] || song.votes} votes
                  </Badge>
                </div>
                <h4 className="font-semibold truncate">{song.song.name}</h4>
                {song.song.album && (
                  <p className="text-sm text-muted-foreground truncate">{song.song.album}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground self-center mr-2">Sort by:</span>
        {[
          { value: 'votes' as const, label: 'Most Voted', icon: TrendingUp },
          { value: 'position' as const, label: 'Position', icon: ChevronUp },
          { value: 'name' as const, label: 'Song Name', icon: Music },
          { value: 'popularity' as const, label: 'Popularity', icon: Users }
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
              sortBy === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Songs List */}
      <div className="space-y-3">
        {sortedSongs.map((setlistSong, index) => {
          const currentVotes = voteCounts[setlistSong.id] || setlistSong.votes;
          const hasVoted = userVoteSet.has(setlistSong.id);
          const isCurrentlyVoting = isVoting === setlistSong.id;
          
          return (
            <Card 
              key={setlistSong.id}
              className={cn(
                "p-4 transition-all duration-200 hover:shadow-md",
                hasVoted && "ring-2 ring-primary/20 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Position/Rank */}
                <div className="text-center min-w-[3rem]">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {sortBy === 'votes' ? index + 1 : setlistSong.position}
                  </div>
                  {sortBy === 'votes' && index < 3 && (
                    <div className="text-xs">
                      {index === 0 ? '👑' : index === 1 ? '🔥' : '⭐'}
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                    {setlistSong.song.name}
                    {hasVoted && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Voted
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {setlistSong.song.album && (
                      <span className="truncate">{setlistSong.song.album}</span>
                    )}
                    {setlistSong.song.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(setlistSong.song.duration)}
                      </span>
                    )}
                    {setlistSong.song.popularity && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {setlistSong.song.popularity}%
                      </span>
                    )}
                  </div>
                  {setlistSong.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {setlistSong.notes}
                    </p>
                  )}
                </div>

                {/* Vote Button */}
                <div className="flex items-center gap-3">
                  <div className="text-center min-w-[4rem]">
                    <div className="text-xl font-bold text-primary">
                      {currentVotes}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                  
                  <VoteButton
                    songId={setlistSong.song.id}
                    showId={showId}
                    setlistSongId={setlistSong.id}
                    currentVotes={currentVotes}
                    hasVoted={hasVoted}
                    position={setlistSong.position}
                    onVote={handleVote}
                    disabled={!setlistSong.canVote || isCurrentlyVoting}
                    isLoading={isCurrentlyVoting}
                  />
                </div>

                {/* External Links */}
                <div className="flex gap-2">
                  {setlistSong.song.spotifyUrl && (
                    <a
                      href={setlistSong.song.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#1DB954] text-white hover:bg-[#1aa34a] transition-colors"
                      title="Listen on Spotify"
                    >
                      <Music className="w-4 h-4" />
                    </a>
                  )}
                  {setlistSong.song.previewUrl && (
                    <button
                      className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      title="Preview"
                    >
                      <Music className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Help Text */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-2">How to Vote</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Click the vote button next to any song you'd like to hear</p>
          <p>• You can vote for multiple songs at this show</p>
          <p>• Songs with more votes have a better chance of being played</p>
          <p>• Your votes help the artist plan the perfect setlist</p>
          <p>• Come back anytime to change your votes before the show!</p>
        </div>
      </Card>
    </div>
  );
}