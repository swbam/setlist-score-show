'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoteButton } from './VoteButton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Music } from 'lucide-react'

interface Song {
  id: string
  title: string
  album?: string
  album_image_url?: string
  duration_ms?: number
  preview_url?: string
}

interface SetlistSong {
  id: string
  position: number
  vote_count: number
  song: Song
}

interface SongListProps {
  songs: SetlistSong[]
  showId: string
  votedSongs: Set<string>
  onVote: (songId: string) => void
  maxVotes?: number
}

export function SongList({ songs, showId, votedSongs, onVote, maxVotes = 10 }: SongListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'position' | 'votes'>('votes')

  // Filter songs based on search
  const filteredSongs = songs.filter(setlistSong =>
    setlistSong.song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setlistSong.song.album?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.vote_count - a.vote_count
    }
    return a.position - b.position
  })

  const formatDuration = (ms?: number) => {
    if (!ms) return null
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Music className="w-6 h-6 text-teal-500" />
            Vote for Songs
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Votes used:</span>
            <Badge 
              variant={votedSongs.size >= maxVotes ? "destructive" : "secondary"}
              className={votedSongs.size >= maxVotes ? "bg-red-500/20 text-red-400" : "bg-gray-700"}
            >
              {votedSongs.size}/{maxVotes}
            </Badge>
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search songs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 focus:border-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'votes'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Most Voted
            </button>
            <button
              onClick={() => setSortBy('position')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'position'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Setlist Order
            </button>
          </div>
        </div>
      </div>

      {/* Song list */}
      <AnimatePresence mode="popLayout">
        {sortedSongs.map((setlistSong, index) => (
          <motion.div
            key={setlistSong.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-lg p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Rank indicator */}
              <div className="text-center min-w-[3rem]">
                <span className="text-2xl font-bold text-gray-600">
                  #{sortBy === 'votes' ? index + 1 : setlistSong.position}
                </span>
              </div>

              {/* Album art */}
              {setlistSong.song.album_image_url && (
                <img
                  src={setlistSong.song.album_image_url}
                  alt={setlistSong.song.album}
                  className="w-12 h-12 rounded-md object-cover"
                />
              )}

              {/* Song info */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{setlistSong.song.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {setlistSong.song.album && <span>{setlistSong.song.album}</span>}
                  {formatDuration(setlistSong.song.duration_ms) && (
                    <span>{formatDuration(setlistSong.song.duration_ms)}</span>
                  )}
                  {setlistSong.song.preview_url && (
                    <a
                      href={setlistSong.song.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 hover:text-teal-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Preview
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Vote button */}
            <VoteButton
              songId={setlistSong.song.id}
              showId={showId}
              setlistSongId={setlistSong.id}
              currentVotes={setlistSong.vote_count}
              hasVoted={votedSongs.has(setlistSong.id)}
              position={index + 1}
              disabled={votedSongs.size >= maxVotes && !votedSongs.has(setlistSong.id)}
              onVote={() => onVote(setlistSong.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {sortedSongs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {searchTerm ? 'No songs found matching your search' : 'No songs available for voting'}
          </p>
        </div>
      )}
    </div>
  )
}