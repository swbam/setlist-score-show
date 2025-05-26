
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Music, Users, TrendingUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import TrendingShows from "@/components/TrendingShows";
import UserFlowTest from "@/components/UserFlowTest";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [showTest, setShowTest] = useState(false);

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

            {/* Test Button */}
            <div className="mb-8">
              <Button 
                onClick={() => setShowTest(!showTest)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
              >
                {showTest ? 'Hide' : 'Show'} End-to-End Test
              </Button>
            </div>

            {/* Test Component */}
            {showTest && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-12"
              >
                <UserFlowTest />
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
