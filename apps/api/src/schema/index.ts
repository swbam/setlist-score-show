import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLSchema } from 'graphql'
import { resolvers } from '../resolvers/index'
import fs from 'fs'
import * as path from 'path'

// Manually load GraphQL files to avoid path.join issues in compiled code
const loadGraphQLFiles = () => {
  const schemaDir = __dirname
  const files = [
    'common.graphql',
    'user.graphql', 
    'artist.graphql',
    'venue.graphql',
    'show.graphql',
    'song.graphql',
    'setlist.graphql',
    'vote.graphql'
  ]
  
  return files.map(file => {
    try {
      return fs.readFileSync(path.join(schemaDir, file), 'utf-8')
    } catch (error) {
      console.warn(`Could not load ${file}:`, error)
      return ''
    }
  }).filter(content => content.length > 0)
}

// Load and merge all type definitions
const typesArray = loadGraphQLFiles()
const typeDefs = mergeTypeDefs(typesArray)

// Create executable schema with type definitions and resolvers
export const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers
} as any)

// Export type definitions for testing or documentation
export { typeDefs }