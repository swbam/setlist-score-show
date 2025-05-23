
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./App.css";

// Import pages
import IndexPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import ArtistPage from "./pages/ArtistPage";
import ShowVoting from "./pages/ShowVoting";
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AllArtists from "./pages/AllArtists";
import SetlistComparison from "./pages/SetlistComparison";
import DataSyncTestPage from "./pages/DataSyncTestPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/artist/:artistId" element={<ArtistPage />} />
        <Route path="/show/:showId" element={<ShowVoting />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/artists" element={<AllArtists />} />
        <Route path="/setlist-comparison/:showId" element={<SetlistComparison />} />
        <Route path="/tests/data-sync" element={<DataSyncTestPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
