'use client'

import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { motion } from 'framer-motion'
import { Sparkles, Music, Vote, TrendingUp } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden bg-black">
      {/* Pure black background - no gradients */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle animated elements - no gradients */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 40, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 60, 0],
            y: [0, 60, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Title */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight">
                TheSet
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Music className="w-8 h-8 text-gray-300" />
              </motion.div>
            </div>
            <motion.div
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-300 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Shape Tomorrow's Shows
            </motion.div>
          </motion.div>
          
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Vote on setlists for upcoming concerts and help artists create unforgettable experiences.
            <span className="block mt-2 text-lg text-gray-400">
              Your voice shapes the music.
            </span>
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="mb-12"
          >
            <UnifiedSearch />
          </motion.div>
          
          {/* Feature highlights */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="relative">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Live Updates</h3>
                <p className="text-gray-400 text-sm">Real-time voting results</p>
              </div>
            </div>
            
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="relative">
                <Vote className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Your Voice</h3>
                <p className="text-gray-400 text-sm">Shape concert setlists</p>
              </div>
            </div>
            
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="relative">
                <TrendingUp className="w-6 h-6 text-gray-300 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Trending</h3>
                <p className="text-gray-400 text-sm">Discover hot shows</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Simple decorative bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-px bg-white/20" />
      </div>
      
      {/* Simple floating particles */}
      <motion.div
        className="absolute top-1/4 left-1/6 w-2 h-2 bg-white/30 rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/50 rounded-full"
        animate={{
          y: [0, -30, 0],
          x: [0, 10, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      <motion.div
        className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/40 rounded-full"
        animate={{
          y: [0, -25, 0],
          x: [0, -15, 0],
          opacity: [0.4, 0.9, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
    </section>
  )
}