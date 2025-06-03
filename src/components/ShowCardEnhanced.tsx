import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, TrendingUp, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface ShowCardProps {
  show: {
    id: string;
    name?: string;
    title?: string;
    date: string;
    start_time?: string;
    status?: string;
    view_count?: number;
    trending_score?: number;
    ticketmaster_url?: string;
    artist?: {
      id: string;
      name: string;
      image_url?: string;
    };
    venue?: {
      id: string;
      name: string;
      city: string;
      state?: string;
      country?: string;
    };
    voteCount?: number;
    userVotes?: number;
  };
  variant?: "grid" | "list" | "compact";
  showActions?: boolean;
}

const ShowCardEnhanced = ({ show, variant = "grid", showActions = true }: ShowCardProps) => {
  const navigate = useNavigate();
  
  const showDate = new Date(show.date);
  const isToday = format(showDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const isTomorrow = format(showDate, "yyyy-MM-dd") === format(new Date(Date.now() + 86400000), "yyyy-MM-dd");
  const isPast = showDate < new Date();

  if (variant === "list") {
    return (
      <Card 
        onClick={() => navigate(`/show/${show.id}`)}
        className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 p-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={show.artist?.image_url || "/placeholder.svg"}
              alt={show.artist?.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
            {isToday && (
              <Badge className="absolute -top-2 -right-2 bg-[#00FF88] text-black">
                Today
              </Badge>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {show.artist?.name || "Unknown Artist"}
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              {show.name || show.title || "Concert"}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(showDate, "MMM d")}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{show.venue?.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{show.view_count || 0} votes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button 
              className="bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium px-6"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/show/${show.id}`);
              }}
            >
              Vote
            </Button>
            {show.ticketmaster_url && (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-800 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88]"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(show.ticketmaster_url, "_blank");
                }}
              >
                <Ticket className="w-3 h-3 mr-1" />
                Tickets
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card 
        onClick={() => navigate(`/show/${show.id}`)}
        className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={show.artist?.image_url || "/placeholder.svg"}
              alt={show.artist?.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-medium text-white text-sm">
                {show.artist?.name}
              </h4>
              <p className="text-xs text-gray-400">
                {format(showDate, "MMM d")} • {show.venue?.city}
              </p>
            </div>
          </div>
          <Button 
            size="sm"
            className="bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium"
          >
            Vote
          </Button>
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
        onClick={() => navigate(`/show/${show.id}`)}
        className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 overflow-hidden h-full group"
      >
        {/* Image Header */}
        <div className="relative h-48">
          <img
            src={show.artist?.image_url || "/placeholder.svg"}
            alt={show.artist?.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4">
            {isToday ? (
              <Badge className="bg-[#00FF88] text-black">Today</Badge>
            ) : isTomorrow ? (
              <Badge className="bg-[#00FF88]/80 text-black">Tomorrow</Badge>
            ) : isPast ? (
              <Badge variant="secondary">Past</Badge>
            ) : (
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                <p className="text-xs font-medium text-[#00FF88]">
                  {format(showDate, "MMM d")}
                </p>
              </div>
            )}
          </div>

          {/* Trending Badge */}
          {show.trending_score && show.trending_score > 80 && (
            <div className="absolute top-4 right-4 bg-[#00FF88]/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#00FF88]" />
              <span className="text-xs font-medium text-[#00FF88]">Hot</span>
            </div>
          )}

          {/* Artist Name */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-lg font-bold text-white line-clamp-1">
              {show.artist?.name || "Unknown Artist"}
            </h3>
            <p className="text-sm text-gray-300 line-clamp-1">
              {show.name || show.title || "Concert"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Venue Info */}
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm line-clamp-1">
              {show.venue?.name} • {show.venue?.city}
              {show.venue?.state && `, ${show.venue.state}`}
            </span>
          </div>

          {/* Time Info */}
          {show.start_time && (
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {format(new Date(`2000-01-01T${show.start_time}`), "h:mm a")}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-xs">{show.view_count || 0} votes</span>
            </div>
            {show.userVotes && show.userVotes > 0 && (
              <Badge variant="secondary" className="text-xs">
                You voted: {show.userVotes}
              </Badge>
            )}
          </div>

          {/* Actions */}
          {showActions && !isPast && (
            <div className="space-y-2">
              <Button 
                className="w-full bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium rounded-lg transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/show/${show.id}`);
                }}
              >
                Vote On Setlist
              </Button>
              
              {show.ticketmaster_url && (
                <Button
                  variant="outline"
                  className="w-full border-gray-800 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88]"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(show.ticketmaster_url, "_blank");
                  }}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  Get Tickets
                </Button>
              )}
            </div>
          )}

          {isPast && (
            <Button 
              variant="outline"
              className="w-full border-gray-800 text-gray-400"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/show/${show.id}`);
              }}
            >
              View Results
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ShowCardEnhanced;