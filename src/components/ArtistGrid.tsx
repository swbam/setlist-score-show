
import React from "react";
import { Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ArtistCard from "./ArtistCard";
import { Artist } from "@/utils/artistUtils";

interface ArtistGridProps {
  artists: Artist[];
  loading: boolean;
  searchPerformed: boolean;
  searchQuery: string;
  handleReset: () => void;
}

const ArtistGrid = ({ 
  artists, 
  loading, 
  searchPerformed,
  searchQuery,
  handleReset 
}: ArtistGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
            <div className="h-40 bg-gray-800" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-800 rounded mb-2" />
              <div className="h-3 bg-gray-800 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (artists.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
        <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No artists found</h3>
        <p className="text-gray-400 mb-6">
          {searchQuery ? "Try a different search term" : "No artists available yet"}
        </p>
        {searchQuery && (
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700"
            onClick={handleReset}
          >
            Show All Artists
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {artists.map(artist => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default ArtistGrid;
