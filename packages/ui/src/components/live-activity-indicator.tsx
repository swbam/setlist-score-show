import * as React from "react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"

interface LiveActivityIndicatorProps {
  activeUsers: number
  className?: string
}

export function LiveActivityIndicator({ activeUsers, className }: LiveActivityIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed bottom-4 right-4 bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg",
        className
      )}
    >
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
      </div>
      <span className="text-sm text-gray-200">
        {activeUsers} {activeUsers === 1 ? 'person' : 'people'} voting now
      </span>
    </motion.div>
  )
}