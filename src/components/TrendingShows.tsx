import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Calendar, MapPin, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface Show {
  id: string;
  name: string;
  date: string;
  image_url?: string;
  view_count: number;
  trending_score: number;
  totalVotes?: number;
  artist?: {
    name: string;
    image_url?: string;
  };
  venue?: {
    name: string;
    city: string;
    state?: string;
  };
  setlists?: Array<{
    setlist_songs?: Array<{
      votes: number;
    }>;
  }>;
}

function TrendingShows() {
  const navigate = useNavigate();

  const { data: shows, isLoading, error } = useQuery({
    queryKey: ["trending-shows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select(`
          *,
          artist:artists(name, image_url),
          venue:venues(name, city, state),
          setlists(
            setlist_songs(votes)
          )
        `)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("trending_score", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(12);

      if (error) {
        console.error("TrendingShows query error:", error);
        throw error;
      }

      // Calculate total votes for each show
      const showsWithVotes: Show[] = data?.map((show: any) => ({
        ...show,
        totalVotes:
          show.setlists?.reduce(
            (total: number, setlist: any) =>
              total +
              (setlist.setlist_songs?.reduce(
                (setlistTotal: number, song: any) =>
                  setlistTotal + (song.votes || 0),
                0
              ) || 0),
            0
          ) || 0,
      })) || [];

      return showsWithVotes;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error("TrendingShows error:", error);
    return (
      <div className="text-center py-12 text-red-500">
        <p>Error loading trending shows: {error.message}</p>
        <p className="text-sm text-muted-foreground mt-2">Check console for details</p>
      </div>
    );
  }

  if (!shows || shows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No upcoming shows found.</p>
        <p className="text-sm text-muted-foreground">
          Try searching for your favorite artists to discover upcoming concerts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Trending Shows
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shows.map((show: Show) => (
          <Card
            key={show.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => navigate(`/show/${show.id}`)}
          >
            {show.image_url && (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={show.image_url}
                  alt={show.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white font-semibold text-lg line-clamp-1">
                    {show.artist?.name}
                  </h3>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-medium line-clamp-2">{show.name}</h4>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(show.date), "MMM d, yyyy")}</span>
                </div>
                {show.venue && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">
                      {show.venue.name}, {show.venue.city}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {show.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {show.totalVotes} votes
                  </span>
                </div>
                {show.trending_score > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Trending
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TrendingShows;
