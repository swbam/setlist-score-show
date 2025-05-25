
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
    <Tabs defaultValue="upcoming" className="space-y-8">
      <TabsList className="bg-gray-900/60 border border-gray-800">
        <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-600">
          Upcoming Shows
        </TabsTrigger>
        <TabsTrigger value="past" className="data-[state=active]:bg-cyan-600">
          Past Shows
        </TabsTrigger>
      </TabsList>
      
      {/* Upcoming Shows Tab */}
      <TabsContent value="upcoming">
        <ShowsList 
          shows={upcomingShows} 
          title="Upcoming Shows"
          emptyMessage={`${artist.name} doesn't have any upcoming shows at the moment`} 
        />
      </TabsContent>
      
      {/* Past Shows Tab */}
      <TabsContent value="past">
        <ShowsList 
          shows={pastShows} 
          title="Past Shows"
          emptyMessage={`${artist.name} doesn't have any past shows in our database`} 
        />
      </TabsContent>
    </Tabs>
  );
}
