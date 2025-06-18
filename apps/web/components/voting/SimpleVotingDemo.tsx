'use client'

import { useState } from 'react'

interface Song {
  title: string
  votes: number
}

export function SimpleVotingDemo() {
  const [songs, setSongs] = useState<Song[]>([
    { title: "Fix You", votes: Math.floor(Math.random() * 50) + 10 },
    { title: "Yellow", votes: Math.floor(Math.random() * 50) + 10 },
    { title: "Viva La Vida", votes: Math.floor(Math.random() * 50) + 10 },
    { title: "The Scientist", votes: Math.floor(Math.random() * 50) + 10 },
    { title: "Paradise", votes: Math.floor(Math.random() * 50) + 10 },
  ])

  const handleVote = (index: number) => {
    setSongs(prev => prev.map((song, i) => 
      i === index 
        ? { ...song, votes: song.votes + 1 }
        : song
    ))
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Popular Songs to Vote On:</h3>
      
      <div className="space-y-3">
        {songs.map((song, index) => (
          <div key={song.title} className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{song.title}</span>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => handleVote(index)}
            >
              Vote ({song.votes})
            </button>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground mt-4">
        This is a demo of the voting functionality. In the full version, votes would be saved to the database.
      </p>
    </div>
  )
} 