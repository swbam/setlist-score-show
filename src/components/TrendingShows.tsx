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
  venue_name: string;
  city: string;
  state: string;
  artist_id: string;
  artist_name: string;
  artist_image_url: string;
  total_votes: number;
  view_count: number;
}

const TrendingShows = () => {
  const navigate = useNavigate();

  const { data: shows, isLoading } = useQuery({
    queryKey: ["trending-shows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select(`
          id,
          date,
          venues!inner(name, city, state),
          artists!inner(id, name, image_url),
          setlists!inner(
            setlist_songs(votes)
          )
        `)
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(8);

      if (error) throw error;

      return data?.map((show: any) => ({
        id: show.id,
        date: show.date,
        venue_name: show.venues.name,
        city: show.venues.city,
        state: show.venues.state,
        artist_id: show.artists.id,
        artist_name: show.artists.name,
        artist_image_url: show.artists.image_url,
        total_votes: show.setlists[0]?.setlist_songs?.reduce(
          (sum: number, song: any) => sum + (song.votes || 0),
          0
        ) || 0,
        view_count: Math.floor(Math.random() * 10000) + 1000, // Placeholder
      })) as TrendingShow[];
    },
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
              <Card key={i} className="bg-card border-border">
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

  return (
    <section className="py-20 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-900/50 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-teal-400" />
              <h2 className="text-4xl font-bold text-white">Trending Shows</h2>
            </div>
            <p className="text-gray-400">Most voted upcoming concerts this week</p>
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            View all shows →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows?.map((show) => (
            <Card
              key={show.id}
              onClick={() => navigate(`/show/${show.id}`)}
              className="group cursor-pointer bg-dark-800/50 backdrop-blur-sm border-dark-700 hover:border-teal-500/50 transition-all duration-300 overflow-hidden"
            >
              {/* Artist Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={show.artist_image_url || "/placeholder.svg"}
                  alt={show.artist_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent"></div>
                
                {/* Vote Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 rounded-full">
                  <span className="text-xs font-medium text-teal-400">{show.total_votes} votes</span>
                </div>

                {/* Artist Name Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{show.artist_name}</h3>
                </div>
              </div>

              {/* Show Details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {format(new Date(show.date), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm line-clamp-1">
                    {show.venue_name}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-3 h-3 ml-0.5" />
                  <span className="text-sm">
                    {show.city}, {show.state}
                  </span>
                </div>

                <div className="pt-3 border-t border-dark-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">{show.view_count.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">Voting open</span>
                  </div>
                </div>
              </div>

              {/* Hover Effect Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {shows?.length === 0 && (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No trending shows yet</h3>
            <p className="text-gray-500">Check back soon for upcoming concerts</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingShows;
