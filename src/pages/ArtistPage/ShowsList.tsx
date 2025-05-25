
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureSetlistExists } from "@/services/setlistCreation";

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
    await ensureSetlistExists(showId);
  };

  if (shows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="grid gap-4">
        {shows.map((show) => (
          <Card key={show.id} className="bg-gray-900 border-gray-800 hover:border-cyan-600 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">
                    {show.name || "Concert"}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-400 text-sm">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      <span>{new Date(show.date).toLocaleDateString()}</span>
                      {show.start_time && (
                        <>
                          <Clock className="h-4 w-4 ml-4 mr-2" />
                          <span>{show.start_time}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {show.venue.name}, {show.venue.city}
                        {show.venue.state && `, ${show.venue.state}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <Badge 
                    variant={show.status === 'scheduled' ? 'default' : 'destructive'}
                    className={show.status === 'scheduled' ? 'bg-green-600/20 text-green-400' : ''}
                  >
                    {show.status}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    {show.ticketmaster_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        asChild
                      >
                        <a 
                          href={show.ticketmaster_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Tickets
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="bg-cyan-600 hover:bg-cyan-700"
                      asChild
                      onClick={() => handleShowClick(show.id)}
                    >
                      <Link to={`/show/${show.id}`}>
                        Vote on Setlist
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShowsList;
