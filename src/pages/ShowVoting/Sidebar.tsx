
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle } from "lucide-react";
import { Show } from "./types";

interface SidebarProps {
  show: Show | null;
  totalVotes: number;
  totalSongs: number;
}

const Sidebar = ({ show, totalVotes, totalSongs }: SidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Voting Stats */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-metal-300 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Voting Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{totalVotes}</div>
            <div className="text-sm text-gray-400">Total Votes</div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Songs in setlist:</span>
            <span className="text-yellow-metal-300 font-medium">{totalSongs}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Voting closes in:</span>
            <span className="text-yellow-metal-300 font-medium">2d 14h</span>
          </div>
          
          <div className="text-center pt-2">
            <div className="text-yellow-metal-400 text-sm font-medium">127 fans have voted</div>
          </div>
        </CardContent>
      </Card>
      
      {/* How It Works */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-yellow-metal-300 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            How it Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-metal-400 text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </div>
              <div className="text-gray-300">
                Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-metal-400 text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </div>
              <div className="text-gray-300">
                Anyone can add songs to the setlist. Select from the dropdown above to help build the perfect concert.
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-metal-400 text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </div>
              <div className="text-gray-300">
                Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-metal-400 text-black rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                4
              </div>
              <div className="text-gray-300">
                <Clock className="inline h-3 w-3 mr-1" />
                Voting closes 2 hours before the show
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
