
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { signInWithEmail, signUp, signInWithSpotify } from "@/services/auth";
import AppHeader from "@/components/AppHeader";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await signInWithEmail(email, password);
      if (data) {
        navigate("/profile");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !displayName) {
      toast.error("Please fill out all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await signUp(email, password, displayName);
      if (data) {
        toast.success("Account created! Please check your email for verification.");
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSpotifySignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithSpotify();
      // Auth callback will handle redirect
    } catch (error) {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="flex items-center justify-center px-4 pt-20 pb-16">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-white">Welcome to TheSet</CardTitle>
            <CardDescription className="text-gray-400">
              Join the community of music fans shaping concert setlists
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Spotify Sign In Button */}
            <div className="mb-6">
              <Button 
                onClick={handleSpotifySignIn} 
                disabled={isLoading}
                className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white font-semibold py-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2">
                  <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,3A9,9 0 0,1 21,12A9,9 0 0,1 12,21A9,9 0 0,1 3,12A9,9 0 0,1 12,3M15.5,10.5C15.5,10.5 13.599,10 12,10C10.476,10 9.01,10.654 9.01,10.654C8.436,10.876 7.75,10.5 7.51,9.9C7.296,9.339 7.654,8.75 8.21,8.5C8.21,8.5 10.077,7.5 12,7.5C14.456,7.5 16.96,8.4 16.96,8.4C17.544,8.615 17.817,9.339 17.601,9.939C17.386,10.539 16.456,10.726 15.5,10.5M14.55,13.5C14.55,13.5 13.146,13.1 12.138,13.1C11.129,13.1 9.666,13.433 9.666,13.433C9.174,13.595 8.55,13.241 8.35,12.75C8.15,12.259 8.487,11.75 8.96,11.55C8.96,11.55 10.707,10.979 12.117,10.979C13.667,10.979 15.049,11.499 15.049,11.499C15.532,11.699 15.791,12.259 15.591,12.75C15.39,13.241 15.032,13.366 14.55,13.5M16.62,15.741C16.62,15.741 14.49,14.5 12,14.5C9.626,14.5 7.351,15.512 7.351,15.512C6.773,15.769 6.213,15.507 6.073,14.93C5.934,14.352 6.194,13.909 6.773,13.77C6.773,13.77 9.371,12.5 12,12.5C14.773,12.5 17.08,13.711 17.08,13.711C17.659,13.909 17.918,14.352 17.659,14.93C17.401,15.507 16.62,15.741 16.62,15.741Z" />
                </svg>
                Continue with Spotify
              </Button>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900 px-2 text-gray-400">or continue with email</span>
                </div>
              </div>
            </div>
            
            {/* Email/Password Auth */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 bg-gray-800">
                <TabsTrigger value="signin" className="data-[state=active]:bg-cyan-600">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-cyan-600">Sign Up</TabsTrigger>
              </TabsList>
              
              {/* Sign In Form */}
              <TabsContent value="signin">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-cyan-600 hover:bg-cyan-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Sign Up Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-cyan-600 hover:bg-cyan-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="text-center text-sm text-gray-400">
            <p className="w-full">
              By continuing, you agree to TheSet's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
