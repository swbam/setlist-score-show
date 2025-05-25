
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
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
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <Button onClick={() => navigate('/')} className="bg-cyan-600 hover:bg-cyan-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
        <SetlistComparison 
          showId={showId} 
          onClose={() => navigate(`/show/${showId}`)}
        />
      </div>
    </div>
  );
};

export default SetlistComparisonPage;
