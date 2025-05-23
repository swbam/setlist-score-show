
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Music, Star, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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

  // Helper function to safely format dates
  const safeFormatDate = (dateStr: any) => {
    if (!dateStr || typeof dateStr === 'object') {
      return 'Date TBA';
    }
    
    try {
      const date = new Date(dateStr);
      
      // Validate the date is valid
      if (isNaN(date.getTime())) {
        return 'Date TBA';
      }
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return 'Date TBA';
    }
  };

  if (loading) {
    return (
      <section className="py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Trending Shows</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="text-white border-white/20 bg-white/5">
                <span>All Shows</span>
              </Button>
              <Button className="bg-white text-black hover:bg-gray-100">
                <span>Trending</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="bg-transparent border-gray-800 animate-pulse">
                <div className="h-48 bg-gray-900"></div>
                <CardContent className="p-5">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-5/6 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
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
      <section className="py-10 bg-black">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Trending Shows</h2>
            <div className="flex gap-2">
              <Button variant="outline" className="text-white border-white/20 bg-white/5">
                <span>All Shows</span>
              </Button>
              <Button className="bg-white text-black hover:bg-gray-100">
                <span>Trending</span>
              </Button>
            </div>
          </div>
          <div className="text-center py-16 bg-black/50 rounded-lg border border-gray-800">
            <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
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
    <section className="py-10 bg-black">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Trending Shows</h2>
          <div className="flex gap-2">
            <Button variant="outline" className="text-white border-white/20 bg-white/5">
              <span>All Shows</span>
            </Button>
            <Button className="bg-white text-black hover:bg-gray-100">
              <span>Trending</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows.map((show) => (
            <div key={show.id} className="relative flex flex-col overflow-hidden rounded-lg">
              {/* Image with overlay */}
              <div className="relative h-64 overflow-hidden">
                {show.image_url ? (
                  <img 
                    src={show.image_url} 
                    alt={show.artist_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-black flex items-center justify-center">
                    <span className="text-xl text-white font-bold">{show.artist_name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                
                {/* Tags at top */}
                <div className="absolute top-4 left-4 flex gap-3">
                  <div className="px-3 py-1 bg-black/70 rounded-full flex items-center text-white text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" /> 
                    <span>Trending</span>
                  </div>
                </div>
                
                {/* Rating at top right */}
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 bg-black/70 rounded-full flex items-center text-amber-300 text-xs">
                    <Star className="h-3 w-3 mr-1 fill-amber-300" />
                    <span>
                      {(Math.random() * 1.5 + 3.5).toFixed(1)} ({Math.floor(Math.random() * 3000) + 500})
                    </span>
                  </div>
                </div>
                
                {/* Voting tag */}
                <div className="absolute bottom-4 left-4">
                  <div className="px-3 py-1 bg-black/70 rounded-full flex items-center text-white text-xs">
                    <span>Voting Open</span>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="pt-4 pb-2 px-2 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {show.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {show.artist_name}
                </p>
                
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center text-gray-400 text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{show.venue_name}, {show.venue_city}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-400 text-sm">
                    <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{safeFormatDate(show.date)}</span>
                    <span className="ml-auto text-gray-500">{Math.floor(Math.random() * 4) + 1} hrs</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <Music className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{['Pop', 'Rock', 'Jazz', 'Country', 'Hip-Hop'][Math.floor(Math.random() * 5)]}</span>
                  </div>
                </div>
                
                <Link to={`/show/${show.id}`} className="mt-4 mb-2">
                  <Button variant="outline" className="w-full text-white border-white/20 bg-white/5 hover:bg-white/10">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingShows;
