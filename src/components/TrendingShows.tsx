
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import * as trendingService from "@/services/trending";

interface TrendingShow {
  id: string;
  name: string;
  date: string;
  votes: number;
  artist_name: string;
  venue_name: string;
  venue_city: string;
  image_url?: string;
}

const TrendingShows = () => {
  const [shows, setShows] = useState<TrendingShow[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTrendingShows = async () => {
      setLoading(true);
      try {
        const trendingShows = await trendingService.getTrendingShows(6);
        console.log('Fetched trending shows:', trendingShows);
        setShows(trendingShows);
      } catch (error) {
        console.error('Error fetching trending shows:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingShows();
  }, []);

  if (loading) {
    return (
      <section className="py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Trending Shows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="bg-gray-800 border-gray-700 animate-pulse">
                <div className="h-48 bg-gray-700"></div>
                <CardContent className="p-5">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shows.length === 0) {
    return (
      <section className="py-10 bg-gradient-to-r from-gray-900 to-black">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Trending Shows</h2>
          <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
            <h3 className="text-xl font-medium text-white mb-2">No upcoming shows</h3>
            <p className="text-gray-400 mb-6">
              Search for your favorite artists to see their upcoming shows
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-gradient-to-r from-gray-900 to-black">
      <div className="container mx-auto max-w-7xl px-4">
        <h2 className="text-3xl font-bold text-white mb-8">Trending Shows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <Link to={`/show/${show.id}`} key={show.id}>
              <Card className="bg-gray-900 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 overflow-hidden h-full">
                <div className="h-48 bg-gray-800 relative">
                  {show.image_url ? (
                    <img 
                      src={show.image_url} 
                      alt={show.artist_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-900/30 to-purple-900/30 flex items-center justify-center">
                      <span className="text-xl text-white font-bold">{show.artist_name}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-xl line-clamp-1">{show.artist_name}</h3>
                    <p className="text-gray-300 text-sm line-clamp-1">{show.name}</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-400">
                      <CalendarDays className="h-4 w-4 mr-2 text-cyan-500" />
                      <span>{format(new Date(show.date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                      <span>
                        {show.venue_name}, {show.venue_city}
                      </span>
                    </div>
                    <div className="text-right mt-2">
                      <span className="bg-cyan-500/20 text-cyan-300 text-xs py-1 px-2 rounded flex items-center justify-end gap-1">
                        <ThumbsUp className="w-3 h-3" /> {show.votes} vote{show.votes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingShows;
