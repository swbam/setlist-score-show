
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useArtistData } from "./useArtistData";
import { ArtistHeader } from "./ArtistHeader";
import { ShowsTabs } from "./ShowsTabs";
import { StatsSection } from "./StatsSection";
import { LoadingState } from "./LoadingState";

const ArtistPage = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { artist, upcomingShows, pastShows, loading, setlistId } = useArtistData(artistId);
  
  // Show loading state
  if (loading || !artist) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <LoadingState />
        <MobileBottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Back to search */}
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <Link 
          to="/artists" 
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to search
        </Link>
      </div>
      
      {/* Artist Header */}
      <ArtistHeader artist={artist} upcomingShowsCount={upcomingShows.length} />
      
      {/* Shows Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12 pb-32 md:pb-12">
        <ShowsTabs 
          artist={artist}
          upcomingShows={upcomingShows} 
          pastShows={pastShows}
        />
        
        {/* Stats Section */}
        <StatsSection setlistId={setlistId} artistId={artist.id} />
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default ArtistPage;
