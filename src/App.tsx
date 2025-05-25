import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { MobileProvider } from "@/context/MobileContext";
import { initBackgroundUpdates } from "@/services/scheduler";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import "./App.css";

// Lazy load pages for code splitting
const IndexPage = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const ShowVoting = lazy(() => import("./pages/ShowVoting"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Login = lazy(() => import("./pages/Login"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Profile = lazy(() => import("./pages/Profile"));
const AllArtists = lazy(() => import("./pages/AllArtists"));
const SetlistComparison = lazy(() => import("./pages/SetlistComparison"));
const DataSyncTestPage = lazy(() => import("./pages/DataSyncTestPage"));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    // Initialize background data synchronization
    initBackgroundUpdates();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <MobileProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              <Route path="/search" element={<SearchResults />} />
              
              {/* SEO-friendly URL structure for artists */}
              <Route path="/artist/:artistId" element={<ArtistPage />} />
              <Route path="/artists/:artistId/:artistSlug" element={<ArtistPage />} />
              
              {/* SEO-friendly URL structure for shows */}
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </MobileProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
