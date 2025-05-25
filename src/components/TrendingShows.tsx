
import React, { useEffect, useState } from "react";
import { TrendingShow, getTrendingShows } from "@/services/trending";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

const TrendingShows = () => {
  const [shows, setShows] = useState<TrendingShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingShows = async () => {
      try {
        const trendingShows = await getTrendingShows(8);
        setShows(trendingShows);
      } catch (error) {
        console.error("Error fetching trending shows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingShows();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-700 rounded mb-4" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {shows.map((show) => (
        <Link key={show.id} to={`/show/${show.id}`}>
          <Card className="bg-gray-900 border-gray-800 hover:border-cyan-600 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-400">
                  Trending
                </Badge>
              </div>
              
              <h3 className="text-white font-semibold mb-2">
                {show.artist.name}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(show.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">
                    {show.venue.name}, {show.venue.city}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{show.view_count} views</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default TrendingShows;
