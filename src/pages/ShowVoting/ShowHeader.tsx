
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { format, isValid } from "date-fns";
import { Show } from "./types";

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
    <div className="relative bg-gradient-to-br from-black to-gray-900">
      {/* Artist image overlay */}
      {show?.artist?.image_url && (
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" 
             style={{ backgroundImage: `url(${show.artist.image_url})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black"></div>
        </div>
      )}
      
      <div className="relative container mx-auto max-w-7xl px-4 pt-8 pb-12">
        {/* Navigation and status */}
        <div className="flex justify-between items-center mb-6">
          {show?.artist?.id && (
            <Link to={`/artist/${show.artist.id}`} className="text-gray-400 hover:text-white flex items-center transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to artist
            </Link>
          )}
          
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${show?.status === 'canceled' ? 'bg-red-900/30 text-red-300 border border-red-900/40' : 
                show?.status === 'postponed' ? 'bg-amber-900/30 text-amber-300 border border-amber-900/40' :
                'bg-cyan-900/30 text-cyan-300 border border-cyan-900/40'}`}>
              {show?.status === 'scheduled' ? 'Upcoming' : 
               show?.status === 'canceled' ? 'Canceled' : 'Postponed'}
            </span>
          </div>
        </div>
        
        {/* Artist and show info */}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            {show?.artist?.name || "Loading..."}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-6">
            {show?.name || 'Concert'}
          </p>
          
          {/* Show details */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-gray-300">
            {show?.date && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-cyan-400" />
                <div>
                  <div className="font-medium">{formatShowDate(show.date)}</div>
                  {show.start_time && (
                    <div className="text-sm text-gray-400 flex items-center mt-1">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {show?.venue && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-cyan-400" />
                <div>
                  <div className="font-medium">{show.venue.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {show.venue.city}
                    {show.venue.state ? `, ${show.venue.state}` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowHeader;
