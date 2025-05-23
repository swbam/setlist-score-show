
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTrendingShows, TrendingShow } from "@/services/trending";
import { formatDate } from "@/lib/utils";

const TrendingShows = () => {
  const [shows, setShows] = useState<TrendingShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrendingShows() {
      setLoading(true);
      try {
        const trendingShows = await getTrendingShows(6);
        setShows(trendingShows);
      } catch (error) {
        console.error("Failed to load trending shows:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTrendingShows();
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Find Your Next Show
          </h2>
          <Link to="/artists">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              View All
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, idx) => (
              <Card key={idx} className="bg-gray-900 border-gray-800">
                <CardContent className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-800 animate-pulse"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-800 animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 animate-pulse rounded w-1/2"></div>
                    <div className="h-10 bg-gray-800 animate-pulse rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : shows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => (
              <Link key={show.id} to={`/show/${show.id}`}>
                <Card className="bg-gray-900 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 card-glow group">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <div className={`h-48 ${show.image_url ? "" : "bg-gradient-to-br from-cyan-600/20 to-blue-600/20"} flex items-center justify-center`}>
                        {show.image_url ? (
                          <img 
                            src={show.image_url} 
                            alt={show.artist_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">{show.artist_name}</h3>
                            <div className="w-12 h-12 mx-auto bg-cyan-500 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-black" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                        <span className="text-cyan-400 text-sm font-medium">{show.votes} votes</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                        {show.artist_name}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-300 text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
                          {formatDate(show.date)}
                        </div>
                        <div className="flex items-center text-gray-300 text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
                          {show.venue_name}, {show.venue_city}
                        </div>
                      </div>

                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                        Vote on Setlist
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No trending shows yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              As users vote on setlists, trending shows will appear here. Search for your favorite artists to get started.
            </p>
            <Link to="/search">
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                Explore Artists
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingShows;
