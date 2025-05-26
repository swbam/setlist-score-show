
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import SetlistComparison from "@/components/SetlistComparison";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SetlistComparisonPage = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();

  if (!showId) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <Button onClick={() => navigate('/')} className="bg-yellow-metal-400 hover:bg-yellow-metal-500 text-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
        <SetlistComparison 
          showId={showId} 
          onClose={() => navigate(`/show/${showId}`)}
        />
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default SetlistComparisonPage;
