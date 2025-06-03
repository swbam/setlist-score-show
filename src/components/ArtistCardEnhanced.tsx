import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Show {
  id: string;
  date: string;
  venue?: {
    name: string;
    city: string;
  };
}

interface ArtistCardProps {
  artist: {
    id: string;
    name: string;
    image_url?: string;
    genres?: string[];
    popularity?: number;
    upcomingShows?: Show[];
    nextShow?: {
      id: string;
      date: string;
      venue: string;
      city: string;
    };
    showCount?: number;
  };
  variant?: "grid" | "list";
  showVoteButton?: boolean;
}

const ArtistCardEnhanced = ({ artist, variant = "grid", showVoteButton = false }: ArtistCardProps) => {
  const navigate = useNavigate();

  if (variant === "list") {
    return (
      <Card 
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 p-4"
      >
        <div className="flex items-center gap-4">
          <img
            src={artist.image_url || "/placeholder.svg"}
            alt={artist.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{artist.name}</h3>
            {artist.genres && artist.genres.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                {artist.genres.slice(0, 2).join(", ")}
              </p>
            )}
            {artist.nextShow && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(artist.nextShow.date), "MMM d")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{artist.nextShow.city}</span>
                </div>
              </div>
            )}
          </div>

          {artist.showCount && artist.showCount > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-[#00FF88]">{artist.showCount}</p>
              <p className="text-xs text-gray-400">upcoming shows</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 overflow-hidden h-full group"
      >
        {/* Artist Image */}
        <div className="relative aspect-square">
          <img
            src={artist.image_url || "/placeholder.svg"}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Popularity Badge */}
          {artist.popularity && artist.popularity > 80 && (
            <div className="absolute top-4 right-4 bg-[#00FF88] text-black px-2 py-1 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-medium">Trending</span>
            </div>
          )}
          
          {/* Artist Name Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white line-clamp-1">{artist.name}</h3>
            {artist.genres && artist.genres.length > 0 && (
              <p className="text-sm text-gray-300 line-clamp-1">
                {artist.genres.slice(0, 2).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {artist.nextShow ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Next: {format(new Date(artist.nextShow.date), "MMM d, yyyy")}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm line-clamp-1">
                  {artist.nextShow.venue} • {artist.nextShow.city}
                </span>
              </div>

              {showVoteButton && (
                <Button 
                  className="w-full bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium rounded-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/show/${artist.nextShow.id}`);
                  }}
                >
                  Vote on Setlist
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No upcoming shows</p>
              <Button 
                variant="outline"
                className="mt-3 border-gray-800 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88]"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/artist/${artist.id}`);
                }}
              >
                Follow Artist
              </Button>
            </div>
          )}

          {artist.showCount && artist.showCount > 1 && (
            <p className="text-center text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
              +{artist.showCount - 1} more shows
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ArtistCardEnhanced;