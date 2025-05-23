
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import VotingStats from "@/components/VotingStats";
import { Setlist, Show } from "./types";

interface SidebarProps {
  setlist: Setlist | null;
  show: Show | null;
}

const Sidebar = ({ setlist, show }: SidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Real voting stats */}
      {setlist && <VotingStats setlistId={setlist.id} />}
      
      {/* How It Works */}
      <Card className="bg-gray-900/40 border-gray-800/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
              Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
              Anyone can add songs to the setlist. Select from the artist's catalog to help build the perfect concert.
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
      
      {/* Ticket Link */}
      {show?.ticketmaster_url && (
        <Card className="bg-gray-900/40 border-gray-800/50 relative overflow-hidden">
          {/* Abstract ticket background */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-y-0 left-0 w-10 border-r border-dashed border-white/20"></div>
            <div className="absolute inset-x-0 top-0 h-10 border-b border-dashed border-white/20"></div>
          </div>
          
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <Ticket className="h-5 w-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Get Tickets</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Secure your spot at this show through Ticketmaster, the official ticket provider.
            </p>
            
            <a 
              href={show.ticketmaster_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2">
                <Ticket className="h-4 w-4" />
                Buy Tickets
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sidebar;
