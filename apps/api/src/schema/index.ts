import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLSchema } from 'graphql'
import path from 'path'
import { resolvers } from '../resolvers'

// Load all .graphql files from the schema directory
const typesArray = loadFilesSync(path.join(__dirname, '.'), {
  extensions: ['graphql'],
})

// Merge all type definitions
const typeDefs = mergeTypeDefs(typesArray)

// Create executable schema with type definitions and resolvers
export const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

// Export type definitions for testing or documentation
export { typeDefs }