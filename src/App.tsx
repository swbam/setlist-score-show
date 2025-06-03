
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { MobileProvider } from "@/context/MobileContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initBackgroundUpdates } from "@/services/scheduler";
import { prefetchStrategies, backgroundSync } from "@/services/reactQueryOptimization";
import "./App.css";

// Import pages
import IndexPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import ArtistPage from "./pages/ArtistPage";
import ShowVotingFixed from "./pages/ShowVoting/ShowVotingFixed";
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
    // TODO: Re-enable background updates after fixing performance issues
    // initBackgroundUpdates();
    
    // Prefetch trending data on app load (less frequently)
    prefetchStrategies.prefetchTrendingData(queryClient);
    
    // Reduce background sync frequency to prevent performance issues
    const syncInterval = setInterval(() => {
      backgroundSync.syncTrendingData(queryClient);
      backgroundSync.syncVoteCounts(queryClient);
    }, 10 * 60 * 1000); // Every 10 minutes instead of 5
    
    // Clean up cache less frequently
    const cleanupInterval = setInterval(() => {
      backgroundSync.cleanupCache(queryClient);
    }, 60 * 60 * 1000); // Every 60 minutes instead of 30
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(cleanupInterval);
    };
  }, [queryClient]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MobileProvider>
          <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* SEO-friendly URL structure for artists */}
          <Route path="/artist/:artistId" element={<ArtistPage />} />
          <Route path="/artists/:artistId/:artistSlug" element={<ArtistPage />} />
          
          {/* SEO-friendly URL structure for shows - consolidated routing */}
          <Route path="/show/:showId" element={<ShowVotingFixed />} />
          <Route path="/events/:showId/:showSlug" element={<ShowVotingFixed />} />
          
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-artists" element={<Profile />} />
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
    </ErrorBoundary>
  );
}

export default App;
