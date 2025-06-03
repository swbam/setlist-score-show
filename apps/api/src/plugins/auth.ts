import fp from 'fastify-plugin'
import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email?: string
      role?: string
      aud?: string
      exp?: number
    }
  }
}

interface AuthPluginOptions {
  supabaseUrl?: string
  supabaseAnonKey?: string
  jwtSecret?: string
}

export const authPlugin = fp(async (fastify, opts: AuthPluginOptions) => {
  // Initialize Supabase client for JWT verification
  const supabaseUrl = opts.supabaseUrl || process.env.SUPABASE_URL
  const supabaseAnonKey = opts.supabaseAnonKey || process.env.SUPABASE_ANON_KEY
  const jwtSecret = opts.jwtSecret || process.env.SUPABASE_JWT_SECRET

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required for auth plugin')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // JWT verification function
  async function verifyJWT(token: string): Promise<any> {
    try {
      // First try to verify with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (!error && user) {
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          aud: user.aud,
          exp: Math.floor(new Date(user.updated_at || '').getTime() / 1000)
        }
      }

      // Fallback to manual JWT verification if we have the secret
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any
        return {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          aud: decoded.aud,
          exp: decoded.exp
        }
      }

      throw new Error('Unable to verify token')
    } catch (error) {
      fastify.log.error('JWT verification failed:', error)
      throw error
    }
  }

  // Auth preHandler hook
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization
      
      if (!authHeader) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'No authorization header provided' 
        })
      }

      const token = authHeader.replace(/^Bearer\s+/i, '')
      
      if (!token) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'No token provided' 
        })
      }

      const user = await verifyJWT(token)
      
      // Check if token is expired
      if (user.exp && user.exp * 1000 < Date.now()) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Token expired' 
        })
      }

      request.user = user
    } catch (error) {
      fastify.log.error('Authentication error:', error)
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid token' 
      })
    }
  })

  // Optional auth preHandler (doesn't fail if no token)
  fastify.decorate('authenticateOptional', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization
      
      if (!authHeader) {
        return // No token is ok for optional auth
      }

      const token = authHeader.replace(/^Bearer\s+/i, '')
      
      if (!token) {
        return // No token is ok for optional auth
      }

      const user = await verifyJWT(token)
      
      // Check if token is expired
      if (user.exp && user.exp * 1000 < Date.now()) {
        return // Expired token is treated as no auth for optional
      }

      request.user = user
    } catch (error) {
      // Log error but don't fail the request for optional auth
      fastify.log.warn('Optional authentication error:', error)
    }
  })

  // Role-based auth decorator
  fastify.decorate('requireRole', function (role: string) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Authentication required' 
        })
      }

      if (request.user.role !== role && request.user.role !== 'admin') {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: `Role '${role}' required` 
        })
      }
    }
  })

  // Add Supabase client to fastify instance
  fastify.decorate('supabaseAuth', supabase.auth)

  fastify.log.info('Auth plugin loaded')
}, {
  name: 'auth-plugin',
  dependencies: []
})

// Type augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authenticateOptional: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (role: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    supabaseAuth: any
  }
}