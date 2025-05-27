
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Show } from "./types";
import VoteTracker from "@/components/VoteTracker";

interface SidebarProps {
  show: Show;
  totalVotes: number;
  totalSongs: number;
  usedVotes?: number;
  maxVotes?: number;
}

const Sidebar = ({ show, totalVotes, totalSongs, usedVotes = 0, maxVotes = 10 }: SidebarProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Time TBA';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Show Details */}
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Show Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">{formatDate(show.date)}</p>
              <p className="text-gray-400 text-sm">{formatTime(show.start_time)}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-white font-medium">{show.venue.name}</p>
              <p className="text-gray-400 text-sm">
                {show.venue.city}
                {show.venue.state && `, ${show.venue.state}`}
                , {show.venue.country}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-white font-medium">{show.view_count} views</p>
              <p className="text-gray-400 text-sm">Total page views</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <Badge variant="outline" className="text-green-400 border-green-400">
              {show.status}
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {totalSongs} Songs
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Vote Tracker */}
      <VoteTracker 
        showId={show.id}
        usedVotes={usedVotes}
        maxVotes={maxVotes}
      />

      {/* Voting Stats */}
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Voting Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{totalVotes}</div>
            <p className="text-gray-400 text-sm">Total Votes Cast</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Votes update in real-time as fans participate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Artist Info */}
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            {show.artist.image_url && (
              <img 
                src={show.artist.image_url} 
                alt={show.artist.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="text-white font-medium">{show.artist.name}</p>
              <p className="text-gray-400 text-sm">Artist</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
