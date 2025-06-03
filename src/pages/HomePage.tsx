
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Music, Users, TrendingUp, TestTube, Database, Activity, Shield, Star, Zap, Target } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import HeroEnhanced from "@/components/HeroEnhanced";
import TrendingShows from "@/components/TrendingShows";
import UserFlowTest from "@/components/UserFlowTest";
import UserFlowTestEnhanced from "@/components/UserFlowTestEnhanced";
import DataSyncTestsEnhanced from "@/tests/DataSyncTestsEnhanced";
import ProductionMonitor from "@/components/ProductionMonitor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HomePage = () => {
  const [showTest, setShowTest] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevelopment(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost');
    
    // Check for admin access (you can implement your own admin check logic)
    const adminKey = localStorage.getItem('admin_access');
    setIsAdmin(adminKey === 'theset_admin_2025' || isDevelopment);
  }, [isDevelopment]);

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Enhanced Hero Section */}
      <HeroEnhanced />

      {/* Development Testing Interface - Moved below hero */}
      {isDevelopment && (
        <section className="py-8 bg-gray-900/50">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-8">
              <Button 
                onClick={() => setShowTest(!showTest)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg mr-4"
              >
                <TestTube className="h-5 w-5 mr-2" />
                {showTest ? 'Hide' : 'Show'} Testing Suite
              </Button>
              <span className="text-sm text-gray-400">Development Mode</span>
            </div>

            {/* Enhanced Testing Suite */}
            {showTest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <Activity className="h-6 w-6 text-yellow-metal-300 mr-3" />
                    <h3 className="text-2xl font-bold text-white">Development Testing Suite</h3>
                  </div>
                  
                  <Tabs defaultValue="user-flow" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                      <TabsTrigger value="user-flow" className="data-[state=active]:bg-yellow-metal-600">
                        <Users className="h-4 w-4 mr-2" />
                        User Flow Tests
                      </TabsTrigger>
                      <TabsTrigger value="data-sync" className="data-[state=active]:bg-yellow-metal-600">
                        <Database className="h-4 w-4 mr-2" />
                        Data Sync Tests
                      </TabsTrigger>
                      <TabsTrigger value="legacy" className="data-[state=active]:bg-yellow-metal-600">
                        <TestTube className="h-4 w-4 mr-2" />
                        Legacy Tests
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="user-flow" className="mt-6">
                      <div className="space-y-4">
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">
                            <strong>Enhanced User Flow Testing:</strong> Comprehensive end-to-end testing with performance monitoring, 
                            real-time subscription validation, and data consistency checks.
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-gray-400">
                            <li>7-step testing pipeline from search to voting</li>
                            <li>Real-time WebSocket connection testing</li>
                            <li>Performance timing and bottleneck identification</li>
                            <li>Data consistency validation across the entire pipeline</li>
                          </ul>
                        </div>
                        <UserFlowTestEnhanced />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="data-sync" className="mt-6">
                      <div className="space-y-4">
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">
                            <strong>Enhanced Database Testing:</strong> Comprehensive database operations testing with 
                            relationship validation, performance monitoring, and data quality analysis.
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-gray-400">
                            <li>Artist, show, and user relationship testing</li>
                            <li>Foreign key constraint validation</li>
                            <li>Performance monitoring with timing metrics</li>
                            <li>Interactive data inspection and debugging</li>
                          </ul>
                        </div>
                        <DataSyncTestsEnhanced />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="legacy" className="mt-6">
                      <div className="space-y-4">
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">
                            <strong>Legacy Testing Component:</strong> Original user flow test for comparison and fallback testing.
                          </p>
                        </div>
                        <UserFlowTest />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Production Monitoring Interface */}
      {isAdmin && (
        <section className="py-8 bg-gray-900/30">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-8">
              <Button 
                onClick={() => setShowMonitor(!showMonitor)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg mr-4"
              >
                <Shield className="h-5 w-5 mr-2" />
                {showMonitor ? 'Hide' : 'Show'} System Monitor
              </Button>
              <span className="text-sm text-gray-400">
                {isDevelopment ? 'Development Mode' : 'Admin Access'}
              </span>
            </div>

            {/* Production System Monitor */}
            {showMonitor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-7xl mx-auto"
              >
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-blue-700 p-6">
                  <div className="flex items-center mb-6">
                    <Shield className="h-6 w-6 text-blue-400 mr-3" />
                    <h3 className="text-2xl font-bold text-white">Production System Monitor</h3>
                    <div className="ml-auto text-sm text-gray-400">
                      Real-time system health and performance monitoring
                    </div>
                  </div>
                  
                  <ProductionMonitor />
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Enhanced How It Works Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900/50 via-black to-gray-900/30 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-yellow-metal-500/5 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-metal-900/30 border border-yellow-metal-500/30 mb-8"
            >
              <Zap className="w-4 h-4 text-yellow-metal-400" />
              <span className="text-sm font-medium text-yellow-metal-300">Simple & Powerful</span>
            </motion.div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              How <span className="bg-gradient-to-r from-yellow-metal-300 to-yellow-metal-500 bg-clip-text text-transparent">TheSet</span> Works
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Transform concert experiences through the power of collective voting. 
              Three simple steps to shape the perfect show.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Enhanced Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-yellow-metal-400/30 transition-all duration-500 hover:transform hover:scale-105">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="relative w-24 h-24 mx-auto mb-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-metal-500 to-yellow-metal-600 rounded-2xl shadow-2xl shadow-yellow-metal-500/25 group-hover:shadow-yellow-metal-400/40 transition-all duration-300" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Search className="h-12 w-12 text-black font-bold" />
                  </div>
                </motion.div>

                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-yellow-metal-600 to-yellow-metal-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-lg">1</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 group-hover:text-yellow-metal-100 transition-colors">
                  Search & Discover
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors">
                  Find your favorite artists and discover upcoming concerts worldwide. 
                  Our real-time search connects to live ticket data.
                </p>

                {/* Decorative Element */}
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Search className="h-16 w-16 text-yellow-metal-400" />
                </div>
              </div>
            </motion.div>

            {/* Enhanced Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-yellow-metal-400/30 transition-all duration-500 hover:transform hover:scale-105">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: -5, scale: 1.1 }}
                  className="relative w-24 h-24 mx-auto mb-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25 group-hover:shadow-purple-500/40 transition-all duration-300" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Music className="h-12 w-12 text-white font-bold" />
                  </div>
                </motion.div>

                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 group-hover:text-blue-100 transition-colors">
                  Vote on Songs
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors">
                  Cast your votes for songs you want to hear live. Deep cuts, fan favorites, 
                  or surprise hits - your voice matters.
                </p>

                {/* Decorative Element */}
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Music className="h-16 w-16 text-blue-400" />
                </div>
              </div>
            </motion.div>

            {/* Enhanced Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-yellow-metal-400/30 transition-all duration-500 hover:transform hover:scale-105">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="relative w-24 h-24 mx-auto mb-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-2xl shadow-green-500/25 group-hover:shadow-teal-500/40 transition-all duration-300" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Target className="h-12 w-12 text-white font-bold" />
                  </div>
                </motion.div>

                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 group-hover:text-green-100 transition-colors">
                  Compare Results
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg group-hover:text-gray-200 transition-colors">
                  After the show, see how fan predictions compare to the actual setlist. 
                  Discover the power of collective music wisdom.
                </p>

                {/* Decorative Element */}
                <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="h-16 w-16 text-green-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 2, delay: 0.8 }}
              viewport={{ once: true }}
              width="800"
              height="200"
              className="absolute"
            >
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <motion.path
                d="M100,100 Q400,50 700,100"
                stroke="url(#pathGradient)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
              />
            </motion.svg>
          </div>
        </div>
      </section>

      {/* Enhanced Trending Shows Section */}
      <section className="py-32 bg-gradient-to-b from-gray-900/30 via-black to-gray-900/50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-yellow-metal-500/5 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-metal-900/30 border border-yellow-metal-500/30 mb-8"
            >
              <TrendingUp className="w-4 h-4 text-yellow-metal-400" />
              <span className="text-sm font-medium text-yellow-metal-300">Live & Real-Time</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-yellow-metal-300 to-yellow-metal-500 bg-clip-text text-transparent">
                Trending
              </span>{" "}
              Shows
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
            >
              Discover the hottest concerts everyone's talking about. 
              Join the conversation and cast your votes now.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <TrendingShows />
          </motion.div>
        </div>
      </section>

      {/* Enhanced Call to Action */}
      <section className="py-32 bg-gradient-to-b from-black via-gray-900/50 to-black relative overflow-hidden">
        {/* Dramatic Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-yellow-metal-500/10 via-purple-500/10 to-blue-500/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-black/50 to-transparent" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-metal-900/40 to-purple-900/40 border border-yellow-metal-500/50 mb-8 backdrop-blur-xl"
            >
              <Star className="w-5 h-5 text-yellow-metal-400" />
              <span className="text-sm font-medium text-yellow-metal-300">Join the Revolution</span>
              <Star className="w-5 h-5 text-yellow-metal-400" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-8 leading-tight"
            >
              Ready to Shape
              <br />
              <span className="bg-gradient-to-r from-yellow-metal-200 via-yellow-metal-400 to-yellow-metal-600 bg-clip-text text-transparent">
                the Show?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Join millions of music fans who are actively influencing live performances 
              around the world. Your voice. Your votes. Your perfect setlist.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/search')}
                className="group relative bg-gradient-to-r from-yellow-metal-600 to-yellow-metal-500 hover:from-yellow-metal-500 hover:to-yellow-metal-400 text-black px-12 py-6 text-xl font-bold rounded-3xl shadow-2xl shadow-yellow-metal-500/25 hover:shadow-yellow-metal-400/40 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-metal-400 to-yellow-metal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center">
                  <Search className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                  Start Voting Now
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-3"
                  >
                    →
                  </motion.div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/how-it-works')}
                className="group border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 hover:border-white/50 px-12 py-6 text-xl font-bold rounded-3xl backdrop-blur-xl transition-all duration-300"
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Final Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-white/10"
            >
              {[
                { label: "Cities Worldwide", value: "500+" },
                { label: "Artists Tracked", value: "25K+" },
                { label: "Monthly Votes", value: "2.5M+" },
                { label: "Satisfied Fans", value: "98%" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-yellow-metal-300 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Shape the Show?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the community of music fans who are actively influencing live performances around the world.
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
