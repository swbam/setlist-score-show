import { GraphQLClient } from 'graphql-request'
import { supabase } from './supabase'
import { SupabaseAdapter } from './supabase-adapter'

const adapter = new SupabaseAdapter()

// Server-side GraphQL client for SSR/SSG usage
export const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_API_URL ? 
    process.env.NEXT_PUBLIC_API_URL + '/graphql' : 
    'http://localhost:4000/graphql'
)

export async function getGraphQLClient() {
  const { data: { session } } = await supabase.auth.getSession()
  
  const client = new GraphQLClient(process.env.NEXT_PUBLIC_API_URL + '/graphql', {
    headers: {
      authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
    },
  })
  
  return client
}

// For client-side usage with React Query
export function useGraphQLClient() {
  // Create a mock GraphQL client that uses Supabase adapter as fallback
  return {
    request: async (query: string, variables?: any) => {
      try {
        // Try GraphQL API first if available
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        if (apiUrl) {
          const { data: { session } } = await supabase.auth.getSession()
          
          const client = new GraphQLClient(apiUrl + '/graphql', {
            headers: {
              authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
            },
          })
          
          return await client.request(query, variables)
        }
      } catch (error: any) {
        // Only log if it's not a network error (API might be down)
        if (!error.message?.includes('ECONNREFUSED')) {
          console.warn('GraphQL API error, using Supabase adapter:', error.message)
        }
      }
      
      // Fallback to Supabase adapter
      return handleQueryWithAdapter(query, variables)
    }
  }
}

async function handleQueryWithAdapter(query: string, variables: any = {}) {
  // Parse query type and route to appropriate adapter method
  if (query.includes('GetShows')) {
    return adapter.getShows(variables.limit, variables.status)
  }
  
  if (query.includes('GetShowWithSetlist')) {
    return adapter.getShowWithSetlist(variables.id)
  }
  
  if (query.includes('GetArtists')) {
    return adapter.getArtists(variables.limit, variables.search)
  }
  
  if (query.includes('GetArtist') || query.includes('artistBySlug')) {
    return adapter.getArtistBySlug(variables.slug)
  }
  
  if (query.includes('SearchAll')) {
    return adapter.search(variables.query)
  }
  
  if (query.includes('CastVote')) {
    return adapter.castVote(variables.showId, variables.setlistSongId)
  }
  
  if (query.includes('GetUserVotes')) {
    return adapter.getUserVotes(variables.showId)
  }
  
  if (query.includes('GetArtistSongs')) {
    return adapter.getArtistSongs(variables.artistId, variables.limit, variables.offset)
  }
  
  if (query.includes('GetTrendingShows')) {
    const result = await adapter.getTrendingShows(variables.limit)
    return { trendingShows: result }
  }
  
  if (query.includes('GetFeaturedArtists')) {
    const result = await adapter.getFeaturedArtists(variables.limit)
    return result
  }
  
  if (query.includes('AddSongToSetlist')) {
    return adapter.addSongToSetlist(variables.setlistId, variables.input)
  }
  
  if (query.includes('GetMyArtists') || query.includes('myArtists')) {
    return adapter.getMyArtists()
  }
  
  // Default fallback
  console.warn('Unhandled query, returning empty result:', query)
  return {}
}