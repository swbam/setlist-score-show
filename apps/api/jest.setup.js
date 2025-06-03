// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long'

// Mock Prisma Client
jest.mock('@setlist/database', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn) => fn({
      artist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      show: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vote: {
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      setlistSong: {
        update: jest.fn(),
      },
      voteAnalytics: {
        upsert: jest.fn(),
      },
    })),
    artist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    show: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  })),
}))

// Mock Redis
jest.mock('ioredis', () => {
  class RedisMock {
    constructor() {}
    get = jest.fn()
    set = jest.fn()
    del = jest.fn()
    incr = jest.fn()
    expire = jest.fn()
    ttl = jest.fn()
    quit = jest.fn()
  }
  return RedisMock
})

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    channel: jest.fn(() => ({
      send: jest.fn(),
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
  })),
}))

// Mock external API clients
jest.mock('./src/lib/spotify', () => ({
  SpotifyClient: jest.fn().mockImplementation(() => ({
    searchTrack: jest.fn(),
    getArtist: jest.fn(),
    getArtistCatalog: jest.fn(),
  })),
}))

jest.mock('./src/lib/setlistfm', () => ({
  SetlistFmClient: jest.fn().mockImplementation(() => ({
    getArtistSetlists: jest.fn(),
    searchArtists: jest.fn(),
  })),
}))

jest.mock('./src/lib/ticketmaster', () => ({
  TicketmasterClient: jest.fn().mockImplementation(() => ({
    searchEvents: jest.fn(),
    getEvent: jest.fn(),
  })),
}))