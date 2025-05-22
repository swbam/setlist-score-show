
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserArtist } from "@/services/user";
import * as userService from "@/services/user";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Loader2, Music, Search, CalendarDays, User2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { user, loading } = useAuth();
  const [userArtists, setUserArtists] = useState<UserArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user's artists
  useEffect(() => {
    async function fetchUserArtists() {
      if (user) {
        try {
          const artists = await userService.getUserArtists();
          setUserArtists(artists);
        } catch (error) {
          console.error("Error fetching user artists:", error);
          toast.error("Failed to load your artists");
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (!loading) {
      if (!user) {
        navigate("/login");
      } else {
        fetchUserArtists();
      }
    }
  }, [user, loading, navigate]);

  // Handle unfollowing artist
  const handleUnfollow = async (artistId: string) => {
    try {
      const success = await userService.unfollowArtist(artistId);
      if (success) {
        setUserArtists(userArtists.filter(ua => ua.artist_id !== artistId));
        toast.success("Artist removed from your list");
      } else {
        toast.error("Failed to unfollow artist");
      }
    } catch (error) {
      console.error("Error unfollowing artist:", error);
      toast.error("An error occurred");
    }
  };

  // If loading auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Artists</h1>
            <p className="text-gray-400 mt-1">
              Keep track of your favorite artists and their upcoming shows
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Search className="h-4 w-4 mr-2" />
            Find Artists
          </Button>
        </div>

        <Tabs defaultValue="artists" className="space-y-6">
          <TabsList className="bg-gray-900/60 border border-gray-800">
            <TabsTrigger value="artists" className="data-[state=active]:bg-cyan-600">
              <Music className="h-4 w-4 mr-2" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-600">
              <CalendarDays className="h-4 w-4 mr-2" />
              Upcoming Shows
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-600">
              <User2 className="h-4 w-4 mr-2" />
              My Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
              </div>
            ) : userArtists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userArtists.map((userArtist) => (
                  <Card 
                    key={userArtist.id}
                    className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-600/50 transition-all duration-300"
                  >
                    <Link to={`/artist/${userArtist.artist_id}`}>
                      <div className="h-48 bg-gray-800 relative">
                        {userArtist.artist?.image_url ? (
                          <img
                            src={userArtist.artist.image_url}
                            alt={userArtist.artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <Music className="h-12 w-12 text-gray-600" />
                          </div>
                        )}
                        {/* Show count badge would go here */}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/artist/${userArtist.artist_id}`}
                          className="text-lg font-medium text-white hover:text-cyan-400 transition-colors"
                        >
                          {userArtist.artist?.name}
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnfollow(userArtist.artist_id)}
                          className="text-xs text-gray-400 hover:text-red-400"
                        >
                          Unfollow
                        </Button>
                      </div>
                      {/* Additional info like upcoming shows count would go here */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No artists yet</h3>
                <p className="text-gray-400 mb-6">
                  Follow your favorite artists to see them here
                </p>
                <Button 
                  onClick={() => navigate("/")}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Artists
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming">
            <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
              <CalendarDays className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400 mb-6">
                We're working on a calendar view for all your upcoming shows
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-cyan-900 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {user?.display_name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{user?.display_name}</h2>
                      <p className="text-gray-400">{user?.email || "No email provided"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Account Type</h3>
                      <p className="text-white">
                        {user?.spotify_id ? "Spotify Account" : "Email Account"}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">Joined</h3>
                      <p className="text-white">
                        {user?.created_at 
                          ? new Date(user.created_at).toLocaleDateString() 
                          : "Unknown"}
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="border-gray-700 text-red-500 hover:text-red-400">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
