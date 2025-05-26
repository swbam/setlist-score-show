
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
    <div 
      className="relative min-h-[400px] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: show.artist?.image_url 
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${show.artist.image_url})`
          : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      <div className="relative z-10 container mx-auto max-w-7xl px-4 pt-24 pb-12">
        {/* Back Navigation */}
        <div className="mb-8">
          {show.artist?.id && (
            <Link 
              to={`/artist/${show.artist.id}`} 
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to artist
            </Link>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Left Side - Show Info */}
          <div className="flex-1">
            {/* Artist Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {show.artist?.name || "Unknown Artist"}
            </h1>
            
            {/* Show Name/Tour Name */}
            {show.name && show.name !== show.artist?.name && (
              <p className="text-xl md:text-2xl text-gray-200 mb-6 font-medium">
                {show.name}
              </p>
            )}
            
            {/* Date and Time */}
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-gray-300 flex-shrink-0" />
              <div className="text-lg text-white">
                <span className="font-semibold">{formatShowDate(show.date)}</span>
                {show.start_time && (
                  <span className="text-gray-300 ml-2">
                    at {formatTime(show.start_time)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Venue */}
            {show.venue && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-300 flex-shrink-0" />
                <div className="text-lg text-white">
                  <span className="font-semibold">{show.venue.name}</span>
                  <span className="text-gray-300 ml-2">
                    • {show.venue.city}
                    {show.venue.state && `, ${show.venue.state}`}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side - Get Tickets Button */}
          {show.ticketmaster_url && (
            <div className="flex-shrink-0">
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 text-lg h-auto"
                asChild
              >
                <a href={show.ticketmaster_url} target="_blank" rel="noopener noreferrer">
                  Get Tickets
                  <ExternalLink className="h-5 w-5 ml-2" />
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
