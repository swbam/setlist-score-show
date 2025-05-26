
import React from "react";
import { Link } from "react-router-dom";
import { Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Artist } from "@/utils/artistUtils";
import { useMobile } from "@/context/MobileContext";

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  const { isMobile } = useMobile();
  
  // Create URL-friendly slug from artist name
  const artistSlug = artist.name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return (
    <Card 
      className={`bg-gray-900 border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 group ${isMobile ? 'native-tap' : ''}`}
    >
      <Link to={`/artists/${artist.id}/${artistSlug}`} className="block h-full">
        <div className={`${isMobile ? 'h-32' : 'h-40'} bg-gray-800 relative`}>
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Music className="h-8 w-8 text-gray-600" />
            </div>
          )}
          
          {/* Source badge */}
          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-black/70 text-gray-300">
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
