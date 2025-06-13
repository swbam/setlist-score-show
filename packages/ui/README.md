# @setlist/ui

Shared UI component library for TheSet with teal gradient theme.

## Installation

This package is part of the monorepo and should be installed via workspace dependencies:

```json
{
  "dependencies": {
    "@setlist/ui": "workspace:*"
  }
}
```

## Usage

### Import Components

```tsx
import { Button, VoteButton, ShowCard } from '@setlist/ui'

function MyComponent() {
  return (
    <div>
      <Button variant="gradient">Click me</Button>
      
      <VoteButton
        songId="song-123"
        showId="show-456"
        currentVotes={42}
        hasVoted={false}
        position={1}
        onVote={handleVote}
      />
      
      <ShowCard
        artistName="Pearl Jam"
        venueName="Madison Square Garden"
        date="2025-07-15"
        city="New York"
        state="NY"
        country="USA"
        voteCount={156}
      />
    </div>
  )
}
```

### Import Styles

In your app's main CSS file:

```css
@import '@setlist/ui/styles.css';
```

Or in your app's entry point:

```tsx
import '@setlist/ui/styles.css'
```

## Theme

The library uses a teal gradient theme with the following key colors:

- Primary: Teal gradient (#14b8a6 to #06b6d4)
- Background: Dark (#0a0a0a)
- Text: Light gray/white
- Accent: Cyan variations

## Components

### Core Components
- `Button` - Themed button with gradient variant
- `Card` - Container with hover effects
- `Input` - Form input with dark theme
- `Label` - Form label
- `Select` - Dropdown select
- `Dialog` - Modal dialog
- `Toast` - Notification toasts

### App-Specific Components
- `VoteButton` - Animated voting button with teal gradient
- `ShowCard` - Concert show display card
- `LiveActivityIndicator` - Real-time activity display

### Utility Components
- `Skeleton` - Loading skeleton
- `Separator` - Visual separator
- `Tooltip` - Hover tooltips

## Development

```bash
# Build the library
pnpm --filter @setlist/ui build

# Watch mode
pnpm --filter @setlist/ui dev

# Type check
pnpm --filter @setlist/ui type-check

# Lint
pnpm --filter @setlist/ui lint
```