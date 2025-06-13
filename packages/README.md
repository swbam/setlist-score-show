# Shared Packages

This directory contains shared packages used across the TheSet monorepo.

## Packages

### @setlist/ui
Shared React components library with teal gradient theme based on shadcn/ui.

- **Location**: `packages/ui`
- **Purpose**: Reusable UI components with consistent styling
- **Key Features**:
  - Teal gradient theme with dark mode
  - Motion animations with Framer Motion
  - Accessible components built on Radix UI
  - TypeScript support

### @setlist/config
Shared configuration files for the monorepo.

- **Location**: `packages/config`
- **Purpose**: Centralized configuration for tools and build processes
- **Includes**:
  - ESLint configuration
  - TypeScript configurations (base, React, Node)
  - Tailwind CSS base configuration

### @setlist/types
Shared TypeScript type definitions.

- **Location**: `packages/types`
- **Purpose**: Common type definitions used across applications
- **Categories**:
  - Database schema types
  - API request/response types
  - External API integration types (Spotify, Setlist.fm, Ticketmaster)
  - Common utility types

## Usage

To use a package in an app or another package, add it as a dependency:

```json
{
  "dependencies": {
    "@setlist/ui": "workspace:*",
    "@setlist/types": "workspace:*"
  },
  "devDependencies": {
    "@setlist/config": "workspace:*"
  }
}
```

Then import as needed:

```typescript
// Using UI components
import { Button, VoteButton, ShowCard } from '@setlist/ui'

// Using types
import { Show, Artist, VoteRequest } from '@setlist/types'

// Using config (in config files)
// tsconfig.json
{
  "extends": "@setlist/config/tsconfig.react.json"
}
```

## Development

Each package has its own build process:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @setlist/ui build

# Watch mode for development
pnpm --filter @setlist/ui dev
```