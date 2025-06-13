import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 240 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-white', className)}
    >
      {/* Musical note icon */}
      <g>
        <path
          d="M20 15 L20 35 M20 35 Q20 40 25 40 Q30 40 30 35 Q30 30 25 30 Q20 30 20 35 M30 20 L30 40 M30 40 Q30 45 35 45 Q40 45 40 40 Q40 35 35 35 Q30 35 30 40 M20 15 L30 20"
          stroke="url(#gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      
      {/* Text */}
      <text x="55" y="35" fill="currentColor" fontSize="24" fontWeight="600" fontFamily="Overpass, sans-serif">
        Setlist Score Show
      </text>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  )
}