
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { format, isValid } from "date-fns";
import { Show } from "./types";
import { Button } from "@/components/ui/button";

// Format date safely
const formatShowDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'Date TBA';
  
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return 'Date TBA';
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date TBA';
  }
};

interface ShowHeaderProps {
  show: Show | null;
}

const ShowHeader = ({ show }: ShowHeaderProps) => {
  return (
    <div className="relative min-h-[400px] bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Artist image overlay */}
      {show?.artist?.image_url && (
        <div className="absolute inset-0 opacity-30 bg-cover bg-center" 
             style={{ backgroundImage: `url(${show.artist.image_url})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black"></div>
        </div>
      )}
      
      <div className="relative container mx-auto max-w-7xl px-4 pt-6 pb-16">
        {/* Navigation */}
        <div className="mb-10">
          {/* Back to artist link */}
          {show?.artist?.id && (
            <Link to={`/artist/${show.artist.id}`} className="inline-flex items-center text-gray-400 hover:text-yellow-metal-300 transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to artist
            </Link>
          )}
        </div>
        
        {/* Show Details */}
        <div className="space-y-6">
          {/* Show Title/Artist */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-2">
              {show?.artist?.name || "Loading..."}
            </h1>
            {show?.name && show.name !== show.artist?.name && (
              <p className="text-xl md:text-2xl text-gray-300">
                {show.name}
              </p>
            )}
          </div>
          
          {/* Show Info */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 text-lg">
            {/* Date */}
            {show?.date && (
              <div className="flex items-center text-yellow-metal-300">
                <Calendar className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-medium">{formatShowDate(show.date)}</div>
                  {show.start_time && (
                    <div className="text-sm text-gray-400">
                      at {format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Venue */}
            {show?.venue && (
              <div className="flex items-center text-yellow-metal-300">
                <MapPin className="h-6 w-6 mr-3" />
                <div>
                  <div className="font-medium">{show.venue.name}</div>
                  <div className="text-sm text-gray-400">
                    {show.venue.city}
                    {show.venue.state && `, ${show.venue.state}`}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Get Tickets Button */}
          {show?.ticketmaster_url && (
            <div className="pt-4">
              <Button 
                size="lg"
                className="bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-semibold text-lg px-8"
                asChild
              >
                <a href={show.ticketmaster_url} target="_blank" rel="noopener noreferrer">
                  Get Tickets
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowHeader;
