
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Show {
  id: string;
  artist: string;
  venue: string;
  date: string;
  location: string;
  votes: number;
  image: string;
}

const TrendingShows = () => {
  const shows: Show[] = [
    {
      id: "1",
      artist: "Imagine Dragons",
      venue: "3Arena (Tele2 Arena)",
      date: "Thursday, June 5, 2025 at 12:30 PM",
      location: "Stockholm",
      votes: 127,
      image: "/lovable-uploads/c21b9df3-c29c-414b-888b-138c7d5c55c9.png"
    },
    {
      id: "2", 
      artist: "Taylor Swift",
      venue: "Madison Square Garden",
      date: "Friday, July 15, 2025 at 8:00 PM",
      location: "New York, NY",
      votes: 2341,
      image: "/placeholder.svg"
    },
    {
      id: "3",
      artist: "The Weeknd",
      venue: "O2 Arena", 
      date: "Saturday, August 20, 2025 at 7:30 PM",
      location: "London, UK",
      votes: 891,
      image: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Find Your Next Show
          </h2>
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <Card key={show.id} className="bg-gray-900 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 card-glow group">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="h-48 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">{show.artist}</h3>
                      <div className="w-12 h-12 mx-auto bg-cyan-500 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-black" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-cyan-400 text-sm font-medium">{show.votes} votes</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                    {show.artist}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-300 text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
                      {show.date}
                    </div>
                    <div className="flex items-center text-gray-300 text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
                      {show.venue}, {show.location}
                    </div>
                  </div>

                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                    Vote on Setlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingShows;
