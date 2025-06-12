import * as React from "react"
import { cn } from "../lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react"
import { motion } from "framer-motion"

interface ShowCardProps {
  artistName: string
  venueName: string
  date: string
  city: string
  state?: string
  country: string
  imageUrl?: string
  voteCount?: number
  trendingScore?: number
  onClick?: () => void
  className?: string
}

export function ShowCard({
  artistName,
  venueName,
  date,
  city,
  state,
  country,
  imageUrl,
  voteCount = 0,
  trendingScore = 0,
  onClick,
  className
}: ShowCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const location = [city, state, country].filter(Boolean).join(', ')

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
    >
      <Card 
        onClick={onClick}
        className={cn(
          "overflow-hidden hover:shadow-xl hover:shadow-slate-500/20 transition-all duration-300",
          className
        )}
      >
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={artistName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {trendingScore > 50 && (
              <div className="absolute top-2 right-2 bg-white text-black px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Trending
              </div>
            )}
          </div>
        )}
        <CardHeader>
          <CardTitle className="gradient-text">{artistName}</CardTitle>
          <CardDescription className="text-base">{venueName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-slate-400" />
              <span>{location}</span>
            </div>
            {voteCount > 0 && (
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-slate-400" />
                <span>{voteCount} votes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}