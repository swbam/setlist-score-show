
import React from "react";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Artist } from "@/utils/artistUtils";

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  return (
    <Card 
      className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300 group"
    >
      <Link to={`/artist/${artist.id}`}>
        <div className="h-40 bg-gray-800 relative">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Music className="h-8 w-8 text-gray-600" />
            </div>
          )}
          
          {/* Source badge */}
          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-black/70 text-white">
            {artist.source === 'database' ? 'Imported' : 'Ticketmaster'}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="text-white font-medium truncate">{artist.name}</h3>
          {artist.genres && artist.genres.length > 0 && (
            <p className="text-sm text-gray-400 truncate">
              {artist.genres.slice(0, 2).join(", ")}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default ArtistCard;
