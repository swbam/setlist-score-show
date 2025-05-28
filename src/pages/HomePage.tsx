
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Music, Users, TrendingUp, TestTube, Database, Activity, Shield } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
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
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-metal-900/20 to-black"></div>
        
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Vote on Your
              <span className="block text-yellow-metal-300">Dream Setlist</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Shape the concert experience by voting on songs you want to hear live. 
              Compare fan predictions with actual setlists after the show.
            </p>

            {/* Development Testing Interface */}
            {isDevelopment && (
              <div className="mb-8">
                <Button 
                  onClick={() => setShowTest(!showTest)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg mr-4"
                >
                  <TestTube className="h-5 w-5 mr-2" />
                  {showTest ? 'Hide' : 'Show'} Testing Suite
                </Button>
                <span className="text-sm text-gray-400">Development Mode</span>
              </div>
            )}

            {/* Production Monitoring Interface */}
            {isAdmin && (
              <div className="mb-8">
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
            )}

            {/* Production System Monitor */}
            {showMonitor && isAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-12 max-w-7xl mx-auto"
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

            {/* Enhanced Testing Suite */}
            {showTest && isDevelopment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-12 max-w-7xl mx-auto"
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
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <SearchBar />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How TheSet Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of fans in shaping concert experiences through collaborative setlist voting
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-metal-600 rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">1. Search & Discover</h3>
              <p className="text-gray-300 leading-relaxed">
                Find your favorite artists and discover upcoming concerts near you or anywhere in the world.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-metal-600 rounded-full flex items-center justify-center">
                <Music className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">2. Vote on Songs</h3>
              <p className="text-gray-300 leading-relaxed">
                Cast your votes for the songs you want to hear live. Add deep cuts, fan favorites, or surprise hits.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-yellow-metal-600 rounded-full flex items-center justify-center">
                <Users className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3. Compare Results</h3>
              <p className="text-gray-300 leading-relaxed">
                After the show, see how the fan-voted setlist compares to what was actually performed.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Shows Section */}
      <section className="py-24">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex items-center justify-center mb-16"
          >
            <TrendingUp className="h-8 w-8 text-yellow-metal-300 mr-3" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Trending Shows
            </h2>
          </motion.div>

          <TrendingShows />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-yellow-metal-900/30 to-black">
        <div className="container mx-auto max-w-7xl px-4 text-center">
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
