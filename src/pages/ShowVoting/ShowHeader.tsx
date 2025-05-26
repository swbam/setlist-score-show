
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, ExternalLink } from "lucide-react";
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

const formatTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return '';
  
  try {
    const time = new Date(`2000-01-01T${timeStr}`);
    if (!isValid(time)) return '';
    return format(time, 'h:mm a');
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

interface ShowHeaderProps {
  show: Show | null;
}

const ShowHeader = ({ show }: ShowHeaderProps) => {
  if (!show) return null;

  return (
    <div className="bg-gray-950 border-b border-gray-800">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          {show.artist?.id && (
            <Link 
              to={`/artist/${show.artist.id}`} 
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {show.artist.name}
            </Link>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Side - Show Info */}
          <div className="flex-1">
            {/* Artist Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {show.artist?.name || "Unknown Artist"}
            </h1>
            
            {/* Show Name (if different from artist) */}
            {show.name && show.name !== show.artist?.name && (
              <p className="text-xl text-gray-300 mb-4">
                {show.name}
              </p>
            )}
            
            {/* Date and Venue Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-300">
              {/* Date */}
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                <div>
                  <span className="font-medium">{formatShowDate(show.date)}</span>
                  {show.start_time && (
                    <span className="ml-2 text-gray-400">
                      at {formatTime(show.start_time)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Venue */}
              {show.venue && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <div>
                    <span className="font-medium">{show.venue.name}</span>
                    <span className="ml-1 text-gray-400">
                      • {show.venue.city}
                      {show.venue.state && `, ${show.venue.state}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Action Button */}
          {show.ticketmaster_url && (
            <div className="flex-shrink-0">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 font-semibold px-6 py-3"
                asChild
              >
                <a href={show.ticketmaster_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
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
