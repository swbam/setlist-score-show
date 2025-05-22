
import { useState } from "react";
import { ArrowLeft, Calendar, MapPin, Users, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import VotingStats from "@/components/VotingStats";
import Header from "@/components/Header";

interface Song {
  id: string;
  title: string;
  album: string;
  votes: number;
  userVoted: boolean;
}

const ShowVoting = () => {
  const [songs, setSongs] = useState<Song[]>([
    { id: "1", title: "Believer", album: "Evolve", votes: 0, userVoted: false },
    { id: "2", title: "Demons", album: "Night Visions", votes: 0, userVoted: false },
    { id: "3", title: "Thunder", album: "Evolve", votes: 0, userVoted: false },
    { id: "4", title: "Bones", album: "Mercury - Acts 1 & 2", votes: 0, userVoted: false },
    { id: "5", title: "Radioactive", album: "Night Visions", votes: 0, userVoted: false }
  ]);

  const handleVote = (songId: string) => {
    setSongs(prev => prev.map(song => 
      song.id === songId 
        ? { ...song, votes: song.userVoted ? song.votes - 1 : song.votes + 1, userVoted: !song.userVoted }
        : song
    ).sort((a, b) => b.votes - a.votes));
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Show Header */}
      <div className="relative h-64 bg-gradient-to-br from-cyan-600/20 to-blue-600/20">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto max-w-7xl px-4 h-full flex items-center">
          <Button variant="ghost" className="text-gray-300 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to artist
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-600 text-white px-2 py-1 rounded text-sm font-medium">
                Upcoming
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Imagine Dragons
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              LOOM World Tour: Official Platinum Tickets
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-gray-300">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-cyan-400" />
                Thursday, June 5, 2025 at 12:30 PM
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-cyan-400" />
                3Arena (Tele2 Arena), Stockholm
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">What do you want to hear?</h2>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  0 votes
                </Button>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  Share
                </Button>
              </div>
            </div>

            <p className="text-gray-300 mb-6">Vote for songs you want to hear at this show.</p>

            {/* Add Song Section */}
            <Card className="bg-gray-900 border-gray-800 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Add a song to this setlist:</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Setlist
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  No songs submitted to the setlist.
                </p>
              </CardContent>
            </Card>

            {/* Songs List */}
            <div className="space-y-4">
              {songs.map((song, index) => (
                <Card key={song.id} className="bg-gray-900 border-gray-800 hover:border-cyan-500/50 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400 w-8">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{song.title}</h3>
                          <p className="text-gray-400 text-sm">{song.album}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-white font-bold">{song.votes}</div>
                          <div className="text-gray-400 text-xs">VOTES</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVote(song.id)}
                            className={`h-8 w-8 p-0 ${song.userVoted ? 'text-cyan-400 bg-cyan-400/20' : 'text-gray-400 hover:text-cyan-400'}`}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center text-gray-400 text-sm mt-6">
              You've used 1/3 free votes
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <VotingStats />
            
            {/* How It Works */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Anyone can add songs to the setlist. Select from the dropdown above to help build the perfect concert.
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Voting closes 2 hours before the show
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
