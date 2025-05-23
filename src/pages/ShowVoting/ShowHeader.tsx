
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Ticket } from "lucide-react";
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
    <div className="relative bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Artist image overlay */}
      {show?.artist?.image_url && (
        <div className="absolute inset-0 opacity-30 bg-cover bg-center" 
             style={{ backgroundImage: `url(${show.artist.image_url})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black"></div>
        </div>
      )}
      
      <div className="relative container mx-auto max-w-7xl px-4 pt-6 pb-16">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-10">
          {/* Back to artist link - positioned at the top left */}
          {show?.artist?.id && (
            <Link to={`/artist/${show.artist.id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to artist
            </Link>
          )}
          
          {/* Status badge - positioned at the top right */}
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block
              ${show?.status === 'canceled' ? 'bg-red-900/50 text-red-300 border border-red-900/40' : 
                show?.status === 'postponed' ? 'bg-amber-900/50 text-amber-300 border border-amber-900/40' :
                'bg-emerald-900/50 text-emerald-300 border border-emerald-900/40'}`}>
              {show?.status === 'scheduled' ? 'Upcoming' : 
               show?.status === 'canceled' ? 'Canceled' : 'Postponed'}
            </span>
          </div>
        </div>
        
        {/* Central content - Artist name and show details */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {show?.artist?.name || "Loading..."}
          </h1>
          
          {/* Only show the show name if it's different from the artist name */}
          {show?.name && show.name !== show.artist?.name && (
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              {show.name}
            </p>
          )}
          
          {/* Show details in a horizontal layout */}
          <div className="flex flex-wrap justify-center gap-12 mb-12">
            {/* Date and time */}
            {show?.date && (
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-cyan-400" />
                <div className="text-left">
                  <div className="font-medium text-lg">{formatShowDate(show.date)}</div>
                  {show.start_time && (
                    <div className="text-gray-400">
                      {format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Venue info */}
            {show?.venue && (
              <div className="flex items-center">
                <MapPin className="h-6 w-6 mr-3 text-cyan-400" />
                <div className="text-left">
                  <div className="font-medium text-lg">{show.venue.name}</div>
                  <div className="text-gray-400">
                    {show.venue.city}
                    {show.venue.state ? `, ${show.venue.state}` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tickets button */}
          {show?.ticketmaster_url && (
            <Button 
              variant="default"
              size="lg"
              className="bg-white text-black hover:bg-gray-200 hover:text-black border-none"
              asChild
            >
              <a href={show.ticketmaster_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                <Ticket className="h-5 w-5 mr-2" />
                Get Tickets
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowHeader;
