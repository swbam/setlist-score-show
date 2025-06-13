// src/lib/prisma.ts
import { PrismaClient } from '@setlist/database'

let prisma: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Middleware for soft deletes (if needed)
    prisma.$use(async (params, next) => {
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development') {
        const before = Date.now()
        const result = await next(params)
        const after = Date.now()
        
        if (after - before > 1000) {
          console.warn(`Slow query (${after - before}ms):`, {
            model: params.model,
            action: params.action
          })
        }
        
        return result
      }
      
      return next(params)
    })
  }

  return prisma
}

export async function closePrismaConnection() {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  const client = getPrismaClient()
  return await client.$transaction(fn, {
    maxWait: 5000, // 5 seconds max wait to start transaction
    timeout: 10000, // 10 seconds max transaction duration
    isolationLevel: 'ReadCommitted'
  })
}

// Query helpers
export const QueryHelpers = {
  // Pagination helper
  paginate: (page: number = 1, limit: number = 20) => ({
    skip: (page - 1) * limit,
    take: limit
  }),

  // Cursor pagination helper
  cursorPaginate: (cursor?: string, limit: number = 20) => {
    const base = { take: limit }
    if (cursor) {
      return {
        ...base,
        skip: 1, // Skip the cursor
        cursor: { id: cursor }
      }
    }
    return base
  },

  // Date range helper
  dateRange: (start?: Date, end?: Date) => {
    const conditions: any = {}
    if (start) conditions.gte = start
    if (end) conditions.lte = end
    return Object.keys(conditions).length > 0 ? conditions : undefined
  },

  // Search helper using pg_trgm
  searchQuery: (searchTerm: string, fields: string[]) => {
    const conditions = fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }))
    
    return { OR: conditions }
  }
}

// Common queries
export const CommonQueries = {
  // Get user with voting stats
  getUserWithStats: async (userId: string) => {
    const prisma = getPrismaClient()
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    // Simplified vote count without complex groupBy to avoid circular reference
    const voteCount = await prisma.vote.count({
      where: { userId: userId }
    })

    return {
      ...user,
      totalVotes: voteCount
    }
  },

  // Get show with all relations
  getShowWithDetails: async (showId: string) => {
    const prisma = getPrismaClient()
    
    return await prisma.show.findUnique({
      where: { id: showId },
      include: {
        artist: true,
        venue: true,
        setlists: {
          include: {
            setlistSongs: {
              include: {
                song: true
              },
              orderBy: {
                position: 'asc'
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })
  },

  // Get trending shows
  getTrendingShows: async (limit: number = 20) => {
    const prisma = getPrismaClient()
    
    // Use raw query to access the materialized view directly
    return await prisma.$queryRaw`
      SELECT *
      FROM trending_shows_view
      WHERE show_status = 'upcoming'
        AND show_date >= CURRENT_DATE
      ORDER BY trending_score DESC
      LIMIT ${limit}
    `
  }
}

export default getPrismaClient