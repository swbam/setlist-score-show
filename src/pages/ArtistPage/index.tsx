
import { useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
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
    return <LoadingState />;
  }
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Artist Header */}
      <ArtistHeader artist={artist} />
      
      {/* Tabs for Upcoming/Past Shows */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <ShowsTabs 
          artist={artist}
          upcomingShows={upcomingShows} 
          pastShows={pastShows}
        />
        
        {/* Stats Section */}
        <StatsSection setlistId={setlistId} artistId={artist.id} />
      </div>
    </div>
  );
};

export default ArtistPage;
