import fp from 'fastify-plugin'
import cors from '@fastify/cors'

export const corsPlugin = fp(async (app) => {
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        process.env.FRONTEND_URL,
        'https://setlist-score-show.vercel.app',
      ].filter(Boolean)

      // Allow requests with no origin (mobile apps, Postman, etc)
      if (!origin) return cb(null, true)

      if (allowedOrigins.includes(origin)) {
        cb(null, true)
      } else if (process.env.NODE_ENV === 'development') {
        // In development, allow all origins
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  })
})