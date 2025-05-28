
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { MobileProvider } from "@/context/MobileContext";
import { initBackgroundUpdates } from "@/services/scheduler";
import { prefetchStrategies, backgroundSync } from "@/services/reactQueryOptimization";
import "./App.css";

// Import pages
import IndexPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import ArtistPage from "./pages/ArtistPage";
import ShowVoting from "./pages/ShowVoting/ShowVoting";
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AllArtists from "./pages/AllArtists";
import SetlistComparison from "./pages/SetlistComparison";
import DataSyncTestPage from "./pages/DataSyncTestPage";
import UserFlowTest from "./components/UserFlowTest";

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize background data synchronization
    initBackgroundUpdates();
    
    // Prefetch trending data on app load
    prefetchStrategies.prefetchTrendingData(queryClient);
    
    // Set up periodic background sync
    const syncInterval = setInterval(() => {
      backgroundSync.syncTrendingData(queryClient);
      backgroundSync.syncVoteCounts(queryClient);
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Clean up cache periodically
    const cleanupInterval = setInterval(() => {
      backgroundSync.cleanupCache(queryClient);
    }, 30 * 60 * 1000); // Every 30 minutes
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(cleanupInterval);
    };
  }, [queryClient]);

  return (
    <AuthProvider>
      <MobileProvider>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* SEO-friendly URL structure for artists */}
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          <Route path="/artists/:artistId/:artistSlug" element={<ArtistPage />} />
          
          {/* SEO-friendly URL structure for shows - consolidated routing */}
          <Route path="/show/:showId" element={<ShowVoting />} />
          <Route path="/events/:showId/:showSlug" element={<ShowVoting />} />
          
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/artists" element={<AllArtists />} />
          
          {/* SEO-friendly URL structure for setlist comparisons */}
          <Route path="/setlist-comparison/:showId" element={<SetlistComparison />} />
          <Route path="/comparison/:showId/:showSlug" element={<SetlistComparison />} />
          
          <Route path="/tests/data-sync" element={<DataSyncTestPage />} />
          <Route path="/tests/user-flow" element={<UserFlowTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </MobileProvider>
    </AuthProvider>
  );
}

export default App;
