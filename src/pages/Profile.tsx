
import React from "react";
import { useAuth } from "@/context/AuthContext";
import MyArtistsDashboard from "@/components/MyArtistsDashboard";
import AppHeader from "@/components/AppHeader";

const Profile = () => {
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
            <p className="text-gray-400">You need to be logged in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* User Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-yellow-metal-900/20 to-yellow-metal-800/20 rounded-xl p-6 border border-yellow-metal-800/30">
          <div className="flex items-center space-x-4 mb-4">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.display_name}
                className="w-16 h-16 rounded-full border-2 border-yellow-metal-400"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-yellow-metal-700 flex items-center justify-center text-white font-bold text-xl border-2 border-yellow-metal-400">
                {userProfile?.display_name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {userProfile?.display_name || user.email}!
              </h1>
              <p className="text-gray-400">
                Manage your favorite artists and track upcoming shows
              </p>
            </div>
          </div>
        </div>
        
        <MyArtistsDashboard />
      </div>
    </div>
  );
};

export default Profile;
