# GraphQL Schema Documentation

This directory contains the GraphQL schema definitions for the Setlist Score Show API.

## Schema Files

- **`common.graphql`** - Common types, scalars, and base schema definitions
- **`artist.graphql`** - Artist entity queries and mutations
- **`show.graphql`** - Show and venue entities with voting context
- **`song.graphql`** - Song catalog and audio features
- **`vote.graphql`** - Voting system queries, mutations, and subscriptions
- **`user.graphql`** - User authentication and preferences
- **`index.ts`** - Schema loader and merger
- **`types.ts`** - TypeScript type definitions

## Key Features

### Queries
- **Artists**: Search, list, and get trending artists
- **Shows**: Find upcoming shows, trending shows, and shows near location
- **Songs**: Browse artist catalogs, search songs, get top voted songs
- **Votes**: Check vote limits, view vote history, get voting stats
- **Users**: Get profile, check notification settings

### Mutations
- **Voting**: Cast votes, remove votes, batch voting
- **Data Sync**: Import artist catalogs, sync with external APIs
- **User Management**: Update profile, connect Spotify, manage preferences
- **Content Creation**: Create custom setlists, add custom songs

### Subscriptions
- **Real-time Voting**: Live vote updates per show
- **Activity Monitoring**: Track active users and recent voting activity

## Authentication

Most mutations and some queries require authentication. The API uses Supabase Auth with JWT tokens.

```graphql
# Example: Authenticated request
mutation CastVote($input: VoteInput!) {
  vote(input: $input) {
    success
    newVoteCount
    dailyVotesRemaining
    showVotesRemaining
  }
}
```

## Rate Limiting

- **Voting**: 5 votes per minute, 50 per day, 10 per show
- **API Calls**: General rate limit of 100 requests per minute

## Pagination

All list queries support cursor-based pagination:

```graphql
query GetShows {
  shows(limit: 20, offset: 0) {
    edges {
      node {
        id
        title
        date
      }
      cursor
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

## Real-time Updates

The API integrates with Supabase Realtime for live updates:

```graphql
subscription WatchShow($showId: ID!) {
  voteUpdates(showId: $showId) {
    setlistSongId
    newVoteCount
    songTitle
    timestamp
  }
}
```

## External Integrations

- **Spotify**: Artist catalogs, song metadata, audio features
- **Setlist.fm**: Historical setlists, tour information
- **Ticketmaster**: Show details, venue information, ticket links