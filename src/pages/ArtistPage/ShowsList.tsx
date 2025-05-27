
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateSetlistWithSongs } from "@/services/setlistCreation";

interface Show {
  id: string;
  name: string;
  date: string;
  start_time?: string | null;
  status: string;
  ticketmaster_url?: string | null;
  venue: {
    name: string;
    city: string;
    state?: string | null;
    country: string;
  };
}

interface ShowsListProps {
  shows: Show[];
  title: string;
  emptyMessage: string;
}

const ShowsList = ({ shows, title, emptyMessage }: ShowsListProps) => {
  const handleShowClick = async (showId: string) => {
    // Ensure setlist exists for this show before navigating
    await getOrCreateSetlistWithSongs(showId);
  };

  if (shows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {shows.map((show) => (
          <div key={show.id} className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/40 hover:border-yellow-metal-600 transition-all duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start gap-6">
                {/* Date Column */}
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <div className="text-yellow-metal-400 text-sm font-medium uppercase tracking-wide">
                    {new Date(show.date).toLocaleDateString('en', { month: 'short' })}
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {new Date(show.date).getDate()}
                  </div>
                  {show.start_time && (
                    <div className="text-gray-400 text-sm mt-1">
                      {new Date(`2000-01-01T${show.start_time}`).toLocaleTimeString('en', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                      })}
                    </div>
                  )}
                </div>

                {/* Show Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-semibold text-lg mb-2">
                        {show.name || "Concert"}
                      </h4>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-300">
                          <span className="font-medium">{show.venue.name}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {show.venue.city}
                            {show.venue.state && `, ${show.venue.state}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center">
                      <Button 
                        className="bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-semibold"
                        asChild
                        onClick={() => handleShowClick(show.id)}
                      >
                        <Link to={`/show/${show.id}`}>
                          View Setlist
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowsList;
