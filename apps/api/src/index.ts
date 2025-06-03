// src/index.ts - Entry point
import { createServer } from './server'

const start = async () => {
  try {
    const server = await createServer()
    
    const port = process.env.PORT || 4000
    const host = process.env.HOST || '0.0.0.0'
    
    await server.listen({ port: Number(port), host })
    
    console.log(`🚀 Server ready at http://${host}:${port}`)
    console.log(`📊 GraphQL playground at http://${host}:${port}/graphql`)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  process.exit(0)
})

start()