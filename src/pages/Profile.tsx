
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { MyArtistsDashboard } from "@/components/MyArtistsDashboard";
import AppHeader from "@/components/AppHeader";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
            <p className="text-gray-600">You need to be logged in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.display_name}!
          </h1>
          <p className="text-gray-600">
            Manage your favorite artists and track upcoming shows
          </p>
        </div>
        
        <MyArtistsDashboard />
      </div>
    </div>
  );
};

export default Profile;
