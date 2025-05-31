
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface TrendingShow {
  id: string;
  date: string;
  name: string;
  venue_name: string;
  city: string;
  state: string;
  artist_id: string;
  artist_name: string;
  artist_image_url: string;
  total_votes: number;
  view_count: number;
}

const TrendingShows = React.memo(() => {
  const navigate = useNavigate();

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ["trending-shows"],
    queryFn: async () => {
      console.log("🔥 Fetching trending shows...");
      
      try {
        const { data, error } = await supabase
          .from("shows")
          .select(`
            id,
            name,
            date,
            view_count,
            venues (name, city, state),
            artists (id, name, image_url)
          `)
          .gte("date", new Date().toISOString())
          .order("view_count", { ascending: false })
          .limit(8);

        if (error) {
          console.error("❌ Error fetching trending shows:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log("⚠️ No shows found");
          return [];
        }

        console.log(`✅ Found ${data.length} shows`);

        return data.map((show: Show) => {
    const venueData = show.venues as Venue;
    const artistData = show.artists as Artist;
          
          return {
            id: show.id,
            date: show.date,
            name: show.name || `${artistData?.name || 'Unknown Artist'} Concert`,
            venue_name: venueData?.name || 'Unknown Venue',
            city: venueData?.city || '',
            state: venueData?.state || '',
            artist_id: artistData?.id || '',
            artist_name: artistData?.name || 'Unknown Artist',
            artist_image_url: artistData?.image_url || '/placeholder.svg',
            total_votes: 0, // Will calculate separately
            view_count: show.view_count || 0,
          };
        }) as TrendingShow[];
      } catch (err) {
        console.error("❌ Error in trending shows query:", err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Trending Shows</h2>
              <p className="text-gray-400">Most voted upcoming concerts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.error("❌ TrendingShows error:", error);
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Trending Shows</h2>
            <p className="text-gray-400 mb-8">Unable to load trending shows. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <h2 className="text-4xl font-bold text-white">Trending Shows</h2>
            </div>
            <p className="text-gray-400">Most viewed upcoming concerts</p>
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
          >
            View all shows →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows && shows.length > 0 ? (
            shows.map((show) => (
              <Card
                key={show.id}
                onClick={() => navigate(`/show/${show.id}`)}
                className="group cursor-pointer bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-yellow-500/50 transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={show.artist_image_url}
                    alt={show.artist_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
                  
                  <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full">
                    <span className="text-xs font-medium text-yellow-400">{show.view_count} views</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{show.artist_name}</h3>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {format(new Date(show.date), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm line-clamp-1">{show.venue_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-3 h-3 ml-0.5" />
                    <span className="text-sm">
                      {show.city}{show.state && `, ${show.state}`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">{show.view_count} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Voting open</span>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No shows available</h3>
              <p className="text-gray-500 mb-4">Check back soon for upcoming concerts</p>
              <button 
                onClick={() => navigate('/search')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Search for Shows
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default TrendingShows;
