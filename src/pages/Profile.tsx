
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Music, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { signOut, getUserTopArtists } from "@/services/auth";
import AppHeader from "@/components/AppHeader";

interface UserArtist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
}

interface UserVoteHistory {
  show_id: string;
  show_name: string;
  artist_name: string;
  date: string;
  song_name: string;
  votes: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  const [followedArtists, setFollowedArtists] = useState<UserArtist[]>([]);
  const [recentVotes, setRecentVotes] = useState<UserVoteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  
  // Fetch user's followed artists and voting history
  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      
      setLoading(true);
      
      try {
        // Get user profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (userData) {
          setUserProfile(userData);
        }
        
        // Get user's followed artists
        const { data: userArtists } = await supabase
          .from('user_artists')
          .select(`
            artists (
              id,
              name,
              image_url,
              genres
            )
          `)
          .eq('user_id', user.id)
          .order('rank', { ascending: false });
          
        if (userArtists) {
          // Extract artists from joined query
          setFollowedArtists(userArtists.map(item => item.artists));
        } else {
          // Try to get from Spotify API for Spotify users
          const spotifyArtists = await getUserTopArtists();
          if (spotifyArtists.length > 0) {
            setFollowedArtists(spotifyArtists);
          }
        }
        
        // Get user's recent votes
        const { data: votesData } = await supabase
          .from('votes')
          .select(`
            created_at,
            setlist_song:setlist_songs (
              song_id,
              votes,
              song:songs (
                name
              ),
              setlist:setlists (
                show:shows (
                  id,
                  name,
                  date,
                  artist:artists (
                    name
                  )
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (votesData) {
          const formattedVotes: UserVoteHistory[] = votesData
            .filter(vote => vote.setlist_song && vote.setlist_song.setlist && vote.setlist_song.setlist.show)
            .map(vote => ({
              show_id: vote.setlist_song.setlist.show.id,
              show_name: vote.setlist_song.setlist.show.name,
              artist_name: vote.setlist_song.setlist.show.artist.name,
              date: vote.setlist_song.setlist.show.date,
              song_name: vote.setlist_song.song.name,
              votes: vote.setlist_song.votes
            }));
            
          setRecentVotes(formattedVotes);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [user]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // This shouldn't happen due to the redirect effect, but just in case
    return null;
  }
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 pt-24 pb-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <UserCircle className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {userProfile?.display_name || 'User'}
              </h1>
              
              <p className="text-gray-300 mt-1">
                {userProfile?.email}
              </p>
              
              <div className="mt-4 flex gap-4 justify-center md:justify-start">
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-red-700/50 text-red-500"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Tabs defaultValue="artists" className="space-y-8">
          <TabsList className="bg-gray-900/60 border border-gray-800">
            <TabsTrigger value="artists" className="data-[state=active]:bg-cyan-600">
              My Artists
            </TabsTrigger>
            <TabsTrigger value="votes" className="data-[state=active]:bg-cyan-600">
              Vote History
            </TabsTrigger>
          </TabsList>
          
          {/* My Artists Tab */}
          <TabsContent value="artists">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">My Artists</h2>
              <p className="text-gray-400">Artists you're following and your top listeners from Spotify</p>
            </div>
            
            {followedArtists.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No followed artists yet</h3>
                <p className="text-gray-400 mb-6">
                  Search for your favorite artists and follow them to see them here
                </p>
                <Link to="/">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    Explore Artists
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {followedArtists.map(artist => (
                  <Link to={`/artist/${artist.id}`} key={artist.id}>
                    <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300">
                      <div className="h-40 bg-gray-800 relative">
                        {artist.image_url ? (
                          <img
                            src={artist.image_url}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <Music className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="text-white font-medium truncate">{artist.name}</h3>
                        {artist.genres && artist.genres.length > 0 && (
                          <p className="text-sm text-gray-400 truncate">
                            {artist.genres.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Vote History Tab */}
          <TabsContent value="votes">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Vote History</h2>
              <p className="text-gray-400">Your recent votes on setlists</p>
            </div>
            
            {recentVotes.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No votes yet</h3>
                <p className="text-gray-400 mb-6">
                  Browse upcoming shows and vote on setlists to see your history here
                </p>
                <Link to="/">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    Find Shows
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentVotes.map((vote, index) => (
                  <Card key={index} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div>
                          <Link to={`/show/${vote.show_id}`}>
                            <h3 className="text-white font-medium hover:text-cyan-500">
                              {vote.artist_name} - {vote.show_name}
                            </h3>
                          </Link>
                          <p className="text-cyan-500 font-medium">"{vote.song_name}"</p>
                          <p className="text-sm text-gray-400">
                            {new Date(vote.date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="mt-2 sm:mt-0 text-right">
                          <div className="text-lg font-bold text-white">{vote.votes}</div>
                          <div className="text-xs text-gray-400">TOTAL VOTES</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
