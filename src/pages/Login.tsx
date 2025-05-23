
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmail, signInWithSpotify } from "@/services/auth";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect to profile
  if (user) {
    navigate("/profile");
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signInWithEmail(email, password);
      if (result?.user) {
        toast.success("Successfully signed in!");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    
    try {
      await signInWithSpotify();
      // Redirect happens in the OAuth flow
    } catch (error) {
      console.error("Spotify login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-cyan-600 p-3 rounded-full mb-4">
            <Music className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome to TheSet</h1>
          <p className="text-gray-400 mt-2">Sign in to vote on setlists and track your favorite artists</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription>Choose your preferred sign in method</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
              onClick={handleSpotifyLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.16-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.78 1.02.42 1.56-.24.48-.96.72-1.56.42z" />
                </svg>
              )}
              Continue with Spotify
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900 px-2 text-gray-400">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-cyan-400 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
