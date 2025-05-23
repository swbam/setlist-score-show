
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Show } from "@/types";

// Helper function to create URL-friendly slug
export const createSlug = (name: string | null | undefined) => {
  if (!name) return 'untitled';
  
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

interface ShowsListProps {
  shows: any[];
  emptyMessage: string;
  type: 'upcoming' | 'past';
  artistName: string;
}

export function ShowsList({ shows, emptyMessage, type, artistName }: ShowsListProps) {
  if (shows.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
        <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No {type} shows</h3>
        <p className="text-gray-400 mb-6">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shows.map((show) => {
        const showSlug = createSlug(show.name || artistName);
        
        return (
          <Card 
            key={show.id}
            className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                <div className="flex-grow space-y-2">
                  {type === 'upcoming' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        show.status === 'canceled' ? 'bg-red-900/50 text-red-300' :
                        show.status === 'postponed' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-green-900/50 text-green-300'
                      }`}>
                        {show.status === 'canceled' ? 'Canceled' :
                          show.status === 'postponed' ? 'Postponed' :
                          'Upcoming'}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        {show.name}
                      </h3>
                    </div>
                  )}
                  
                  {type === 'past' && (
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {show.name}
                    </h3>
                  )}
                  
                  <div className="flex flex-col space-y-2 text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-cyan-500" />
                      <span>{format(new Date(show.date), 'EEEE, MMMM d, yyyy')}</span>
                      {show.start_time && type === 'upcoming' && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(`2000-01-01T${show.start_time}`), 'h:mm a')}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                      <span>
                        {show.venue?.name}, {show.venue?.city}
                        {show.venue?.state ? `, ${show.venue.state}` : ''}, {show.venue?.country}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex space-x-3">
                  {type === 'past' && (
                    <Link to={`/comparison/${show.id}/${showSlug}`}>
                      <Button variant="outline" className="border-cyan-600 text-cyan-500">
                        View Comparison
                      </Button>
                    </Link>
                  )}
                  <Link to={`/events/${show.id}/${showSlug}`}>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      {type === 'upcoming' ? 'Vote on Setlist' : 'View Setlist'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
