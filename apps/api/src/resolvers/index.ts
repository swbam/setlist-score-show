import { mergeResolvers } from '@graphql-tools/merge'
import { IResolvers } from '@graphql-tools/utils'
import { artistResolvers } from './artist.resolver'
import { showResolvers } from './show.resolver'
import { songResolvers } from './song.resolver'
import { voteResolvers } from './vote.resolver'
import { userResolvers } from './user.resolver'
import { commonResolvers } from './common.resolver'
import { subscriptionResolvers } from './subscription.resolver'
import { setlistResolvers } from './setlist.resolver'
import { venueResolvers } from './venue.resolver'

// Merge all resolvers into a single resolver map
export const resolvers: IResolvers = mergeResolvers([
  commonResolvers,
  artistResolvers,
  showResolvers,
  songResolvers,
  voteResolvers,
  userResolvers,
  subscriptionResolvers,
  setlistResolvers,
  venueResolvers,
])

// Export individual resolvers for testing
export {
  artistResolvers,
  showResolvers,
  songResolvers,
  voteResolvers,
  userResolvers,
  commonResolvers,
  subscriptionResolvers,
  setlistResolvers,
  venueResolvers,
}