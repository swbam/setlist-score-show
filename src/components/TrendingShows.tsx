
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Music, ThumbsUp } from 'lucide-react';
import { format, isValid } from 'date-fns';
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
  artist_id?: string; // Added to track unique artists
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
  const safeFormatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) {
      return 'Date TBA';
    }
    
    try {
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (!isValid(date)) {
        return 'Date TBA';
      }
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return 'Date TBA';
    }
  };

  if (loading) {
    return <section className="py-10">
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
            {[1, 2, 3, 4].map(item => <Card key={item} className="bg-transparent border-gray-800 animate-pulse">
                <div className="h-48 bg-gray-900"></div>
                <CardContent className="p-5">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-5/6 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>;
  }
  
  if (shows.length === 0) {
    return <section className="py-10 bg-black">
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
      </section>;
  }
  
  return (
    <section className="py-10 bg-black">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Trending Shows</h2>
          <div className="flex gap-2">
            <Link to="/shows">
              <Button variant="outline" className="text-white border-white/20 bg-white/5">
                <span>All Shows</span>
              </Button>
            </Link>
            <Button className="bg-white text-black hover:bg-gray-100">
              <span>Trending</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows.map(show => (
            <Link to={`/show/${show.id}`} key={show.id}>
              <Card className="bg-transparent border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300">
                <div className="h-40 bg-gray-900 relative">
                  {show.image_url ? (
                    <img 
                      src={show.image_url} 
                      alt={show.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Music className="h-10 w-10 text-gray-700" />
                    </div>
                  )}
                </div>
                
                <CardContent className="p-5">
                  <h3 className="text-lg font-medium text-white mb-1 line-clamp-2">{show.name}</h3>
                  <p className="text-cyan-400 text-sm font-medium mb-2">{show.artist_name}</p>
                  
                  <div className="flex items-start gap-2 text-sm text-gray-400 mb-1">
                    <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{safeFormatDate(show.date)}</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{show.venue_name}, {show.venue_city}</span>
                  </div>
                  
                  {show.votes > 0 && (
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-white">
                      <ThumbsUp className="h-3 w-3 text-cyan-400" />
                      <span>{show.votes} votes</span>
                    </div>
                  )}
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
