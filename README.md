# Setlist Score Show

A crowdsourced concert setlist voting platform built with Next.js, Fastify, GraphQL, and Supabase.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Fastify, GraphQL (Mercurius), Prisma ORM
- **Database**: PostgreSQL 15 with Supabase
- **Real-time**: Supabase Realtime
- **Caching**: Redis
- **External APIs**: Spotify, Setlist.fm, Ticketmaster
- **Infrastructure**: Docker, Vercel, Railway, GitHub Actions

## 🏗️ Architecture

This is a Turborepo monorepo with the following structure:

```
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Fastify GraphQL API server
├── packages/
│   ├── database/     # Prisma schema and migrations
│   ├── ui/           # Shared React components
│   ├── config/       # Shared configurations
│   └── types/        # Shared TypeScript types
└── infra/            # Infrastructure configurations
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 15
- Redis

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development databases
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

This will start:
- Web app at http://localhost:3000
- API server at http://localhost:4000
- GraphQL playground at http://localhost:4000/graphql

## 📦 Available Scripts

### Development
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all code
- `pnpm type-check` - Type check all TypeScript
- `pnpm test` - Run all tests

### Database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:migrate:create` - Create a new migration
- `pnpm db:push` - Push schema changes (dev only)
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed database with initial data

### Deployment
- `pnpm deploy:web` - Deploy web app to Vercel
- `pnpm deploy:api` - Deploy API to Railway
- `pnpm deploy:all` - Deploy everything

## 🎯 Key Features

- **Live Voting**: Real-time setlist voting with WebSocket updates
- **Song Catalog**: Complete artist discographies from Spotify
- **Show Discovery**: Find upcoming and past shows via Setlist.fm
- **Vote Limits**: Fair voting with daily and per-show limits
- **Trending Shows**: Algorithm-based trending show recommendations
- **Mobile Optimized**: Responsive design with mobile-first approach

## 🔒 Security

- JWT-based authentication with Supabase Auth
- Rate limiting on all endpoints
- SQL injection protection via Prisma
- XSS protection with React
- CORS configured for production domains

## 📊 Performance

- GraphQL query optimization with DataLoader
- Redis caching for external API calls
- Database indexes for common queries
- CDN for static assets
- Image optimization with Next.js

## 🚢 Deployment

### Production Architecture

- **Frontend**: Vercel (automatic deploys from main branch)
- **API**: Railway with Docker containers
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Cloudflare
- **Monitoring**: Sentry

### CI/CD Pipeline

GitHub Actions workflow:
1. Run linting and type checking
2. Run unit and integration tests
3. Run E2E tests with Playwright
4. Build Docker images
5. Deploy to staging
6. Run smoke tests
7. Deploy to production

## 📝 License

MIT

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.