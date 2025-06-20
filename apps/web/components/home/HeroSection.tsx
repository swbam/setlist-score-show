'use client'

import { UnifiedSearch } from '@/components/search/UnifiedSearch'
import { motion } from 'framer-motion'
import { Sparkles, Music, Vote, TrendingUp } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Enhanced Apple-tier gradient background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        
        {/* Dynamic color layers */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-pink-600/40 via-purple-500/30 to-blue-600/40"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute inset-0 bg-gradient-to-bl from-cyan-500/20 via-transparent to-emerald-500/20"
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 rounded-full blur-3xl"
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
      
      {/* Enhanced glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
      
      {/* Enhanced Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Enhanced Title */}
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
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight">
                TheSet
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Music className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
            <motion.div
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Shape Tomorrow's Shows
            </motion.div>
          </motion.div>
          
          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Vote on setlists for upcoming concerts and help artists create unforgettable experiences.
            <span className="block mt-2 text-lg text-white/70">
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
          
          {/* Enhanced feature highlights */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Live Updates</h3>
                <p className="text-white/70 text-sm">Real-time voting results</p>
              </div>
            </div>
            
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <Vote className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Your Voice</h3>
                <p className="text-white/70 text-sm">Shape concert setlists</p>
              </div>
            </div>
            
            <div className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Trending</h3>
                <p className="text-white/70 text-sm">Discover hot shows</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-32 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      
      {/* Floating particles */}
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
        className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/50 rounded-full"
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
        className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-400/40 rounded-full"
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