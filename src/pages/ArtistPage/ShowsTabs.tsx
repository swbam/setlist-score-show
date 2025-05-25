
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShowsList from "./ShowsList";
import { SpotifyArtist } from "@/services/spotify";

interface ShowsTabsProps {
  artist: SpotifyArtist;
  upcomingShows: any[];
  pastShows: any[];
}

export function ShowsTabs({ artist, upcomingShows, pastShows }: ShowsTabsProps) {
  return (
    <div className="space-y-8">
      <div className="border-b border-gray-800">
        <div className="flex space-x-8">
          <button className="pb-4 text-white font-medium border-b-2 border-yellow-metal-400">
            Upcoming Shows
          </button>
          <button className="pb-4 text-gray-400 font-medium hover:text-white transition-colors">
            Past Shows
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Vote on setlists for upcoming shows</h3>
        </div>
        
        <ShowsList 
          shows={upcomingShows} 
          title="Upcoming Shows"
          emptyMessage={`${artist.name} doesn't have any upcoming shows at the moment`} 
        />
      </div>
    </div>
  );
}
