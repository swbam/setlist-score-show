import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { z } from 'zod'
import superjson from 'superjson'
import { supabase } from './supabase'

// Context creation
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req } = opts
  
  // Get user from auth header
  const token = req.headers.authorization?.replace('Bearer ', '')
  let user = null
  
  if (token) {
    const { data: { user: authUser } } = await supabase.auth.getUser(token)
    user = authUser
  }

  return {
    user,
    supabase,
  }
}

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Create router and procedure helpers
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

// Protected procedure
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

// Example router procedures
export const appRouter = createTRPCRouter({
  // Public procedures
  shows: createTRPCRouter({
    list: publicProcedure
      .input(z.object({
        status: z.enum(['all', 'upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        let query = ctx.supabase
          .from('shows')
          .select(`
            *,
            artist:artists(*),
            venue:venues(*),
            _count:votes(count)
          `)
          .order('date', { ascending: true })
          .range(input.offset, input.offset + input.limit - 1)

        if (input.status && input.status !== 'all') {
          query = query.eq('status', input.status)
        }

        if (input.search) {
          query = query.or(`artist.name.ilike.%${input.search}%,venue.name.ilike.%${input.search}%`)
        }

        const { data, error } = await query

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

        return data
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('shows')
          .select(`
            *,
            artist:artists(*),
            venue:venues(*),
            setlists(
              *,
              setlist_songs(
                *,
                song:songs(*)
              )
            )
          `)
          .eq('id', input.id)
          .single()

        if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Show not found' })

        return data
      }),

    trending: publicProcedure
      .query(async ({ ctx }) => {
        const { data, error } = await ctx.supabase
          .from('trending_shows')
          .select('*')
          .order('trending_score', { ascending: false })
          .limit(10)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

        return data
      }),
  }),

  // Protected procedures
  voting: createTRPCRouter({
    castVote: protectedProcedure
      .input(z.object({
        showId: z.string().uuid(),
        songId: z.string().uuid(),
        setlistSongId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .rpc('cast_vote', {
            p_user_id: ctx.user.id,
            p_show_id: input.showId,
            p_song_id: input.songId,
            p_setlist_song_id: input.setlistSongId,
          })

        if (error) {
          if (error.message.includes('Daily vote limit')) {
            throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: error.message })
          }
          if (error.message.includes('Show vote limit')) {
            throw new TRPCError({ code: 'FORBIDDEN', message: error.message })
          }
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
        }

        return data
      }),

    getUserVotes: protectedProcedure
      .input(z.object({ showId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('votes')
          .select('*')
          .eq('user_id', ctx.user.id)
          .eq('show_id', input.showId)

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

        return data
      }),

    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data, error } = await ctx.supabase
          .from('vote_analytics')
          .select('*')
          .eq('user_id', ctx.user.id)
          .gte('last_vote_at', today.toISOString())

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

        const totalDailyVotes = data.reduce((sum, record) => sum + record.daily_votes, 0)

        return {
          dailyVotes: totalDailyVotes,
          dailyVotesRemaining: 50 - totalDailyVotes,
          showVotes: data,
        }
      }),
  }),
})

// Export type router type signature
export type AppRouter = typeof appRouter