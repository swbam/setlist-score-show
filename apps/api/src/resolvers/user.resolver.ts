import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'

export const userResolvers: IResolvers = {
  Query: {
    me: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        return null
      }

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { userPreferences: true },
      })
    },

    myArtists: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const follows = await prisma.userFollowsArtist.findMany({
        where: { userId: user.id },
        include: { artist: true },
        orderBy: { followedAt: 'desc' },
      })

      return follows.map(follow => ({
        artist: follow.artist,
        followedAt: follow.followedAt,
      }))
    },

    user: async (_parent, { id }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // TODO: Add admin role check here
      // if (!user.isAdmin) {
      //   throw new GraphQLError('Admin access required', {
      //     extensions: { code: 'FORBIDDEN' },
      //   })
      // }

      const requestedUser = await prisma.user.findUnique({
        where: { id },
        include: { userPreferences: true },
      })

      if (!requestedUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return requestedUser
    },

    isEmailAvailable: async (_parent, { email }, { prisma }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      return !existingUser
    },

    notificationSettings: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const userWithPrefs = await prisma.user.findUnique({
        where: { id: user.id },
        include: { userPreferences: true },
      })

      if (!userWithPrefs?.userPreferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = await prisma.userPreferences.create({
          data: {
            userId: user.id,
            emailNotifications: true,
            pushNotifications: false,
            showCompletedShows: false,
            theme: 'SYSTEM',
            favoriteGenres: [],
          },
        })

        return defaultPrefs
      }

      return userWithPrefs.userPreferences
    },
  },

  Mutation: {
    updateProfile: async (_parent, { displayName, avatarUrl }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const updateData: any = {}
      if (displayName !== undefined) updateData.displayName = displayName
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

      return prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { userPreferences: true },
      })
    },

    updatePreferences: async (_parent, { preferences }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const updateData: any = {}
      
      if (preferences.emailNotifications !== undefined) {
        updateData.emailNotifications = preferences.emailNotifications
      }
      if (preferences.pushNotifications !== undefined) {
        updateData.pushNotifications = preferences.pushNotifications
      }
      if (preferences.showCompletedShows !== undefined) {
        updateData.showCompletedShows = preferences.showCompletedShows
      }
      if (preferences.theme !== undefined) {
        updateData.theme = preferences.theme
      }
      if (preferences.favoriteGenres !== undefined) {
        updateData.favoriteGenres = preferences.favoriteGenres
      }
      if (preferences.defaultLocation !== undefined) {
        updateData.defaultLocation = preferences.defaultLocation
      }

      // Upsert preferences
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: updateData,
        create: {
          userId: user.id,
          ...updateData,
          emailNotifications: updateData.emailNotifications ?? true,
          pushNotifications: updateData.pushNotifications ?? false,
          showCompletedShows: updateData.showCompletedShows ?? false,
          theme: updateData.theme ?? 'SYSTEM',
          favoriteGenres: updateData.favoriteGenres ?? [],
        },
      })

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { userPreferences: true },
      })
    },

    connectSpotify: async (_parent, { code, redirectUri }, { user, prisma, services }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      if (!services?.spotify) {
        throw new GraphQLError('Spotify service not available', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      }

      try {
        // Exchange code for tokens
        const tokens = await services.spotify.exchangeCodeForTokens(code, redirectUri)
        
        // Get Spotify user profile
        const spotifyProfile = await services.spotify.getUserProfile(tokens.access_token)

        // Update user with Spotify data
        return prisma.user.update({
          where: { id: user.id },
          data: {
            spotifyId: spotifyProfile.id,
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            spotifyTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
          include: { userPreferences: true },
        })
      } catch (error: any) {
        throw new GraphQLError('Failed to connect Spotify account', {
          extensions: { 
            code: 'EXTERNAL_SERVICE_ERROR',
            details: error.message,
          },
        })
      }
    },

    disconnectSpotify: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return prisma.user.update({
        where: { id: user.id },
        data: {
          spotifyId: null,
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiresAt: null,
        },
        include: { userPreferences: true },
      })
    },

    followArtist: async (_parent, { artistId }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // Check if artist exists
      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
      })

      if (!artist) {
        throw new GraphQLError('Artist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Check if already following
      const existing = await prisma.userFollowsArtist.findUnique({
        where: {
          userId_artistId: {
            userId: user.id,
            artistId: artistId,
          },
        },
      })

      if (existing) {
        return {
          artist,
          followedAt: existing.followedAt,
        }
      }

      // Create new follow
      const follow = await prisma.userFollowsArtist.create({
        data: {
          userId: user.id,
          artistId: artistId,
        },
        include: { artist: true },
      })

      return {
        artist: follow.artist,
        followedAt: follow.followedAt,
      }
    },

    unfollowArtist: async (_parent, { artistId }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      try {
        await prisma.userFollowsArtist.delete({
          where: {
            userId_artistId: {
              userId: user.id,
              artistId: artistId,
            },
          },
        })

        return {
          success: true,
          user: null,
          message: 'Artist unfollowed successfully',
        }
      } catch (error: any) {
        return {
          success: false,
          user: null,
          message: 'Failed to unfollow artist',
        }
      }
    },

    importSpotifyArtists: async (_parent, _args, { user, prisma, spotify }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // Check if user has Spotify connected
      const userWithSpotify = await prisma.user.findUnique({
        where: { id: user.id },
        select: { spotifyId: true },
      })

      if (!userWithSpotify?.spotifyId) {
        throw new GraphQLError('Spotify account not connected', {
          extensions: { code: 'PRECONDITION_FAILED' },
        })
      }

      try {
        // Get user's top artists from Spotify
        const topArtists = await spotify.getUserTopItems('artists', {
          limit: 50,
          time_range: 'long_term',
        })

        const followedArtists = []

        for (const spotifyArtist of topArtists.items) {
          // Check if artist exists in our database
          let artist = await prisma.artist.findUnique({
            where: { spotifyId: spotifyArtist.id },
          })

          if (!artist) {
            // Create artist if doesn't exist
            const slug = spotifyArtist.name.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()

            artist = await prisma.artist.create({
              data: {
                spotifyId: spotifyArtist.id,
                name: spotifyArtist.name,
                slug: slug,
                imageUrl: spotifyArtist.images[0]?.url || null,
                genres: spotifyArtist.genres,
                popularity: spotifyArtist.popularity || 0,
                followers: spotifyArtist.followers?.total || 0,
              },
            })
          }

          // Check if already following
          const existingFollow = await prisma.userFollowsArtist.findUnique({
            where: {
              userId_artistId: {
                userId: user.id,
                artistId: artist.id,
              },
            },
          })

          if (!existingFollow) {
            // Create follow relationship
            const follow = await prisma.userFollowsArtist.create({
              data: {
                userId: user.id,
                artistId: artist.id,
              },
              include: { artist: true },
            })

            followedArtists.push({
              artist: follow.artist,
              followedAt: follow.followedAt,
            })
          }
        }

        return followedArtists
      } catch (error: any) {
        throw new GraphQLError('Failed to import Spotify artists', {
          extensions: { 
            code: 'EXTERNAL_SERVICE_ERROR',
            details: error.message,
          },
        })
      }
    },

    deleteAccount: async (_parent, { confirmation }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      if (confirmation !== user.email) {
        throw new GraphQLError('Invalid confirmation. Please type your email address to confirm.', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      try {
        // Delete user and all related data (cascading deletes should handle this)
        await prisma.user.delete({
          where: { id: user.id },
        })

        return {
          success: true,
          user: null,
          message: 'Account deleted successfully',
        }
      } catch (error: any) {
        return {
          success: false,
          user: null,
          message: 'Failed to delete account: ' + error.message,
        }
      }
    },
  },

  User: {
    preferences: async (parent, _args, { prisma }) => {
      let prefs = await prisma.userPreferences.findUnique({
        where: { userId: parent.id },
      })

      if (!prefs) {
        // Create default preferences if they don't exist
        prefs = await prisma.userPreferences.create({
          data: {
            userId: parent.id,
            emailNotifications: true,
            pushNotifications: false,
            showCompletedShows: false,
            theme: 'SYSTEM',
            favoriteGenres: [],
          },
        })
      }

      return {
        emailNotifications: prefs.emailNotifications,
        pushNotifications: prefs.pushNotifications,
        showCompletedShows: prefs.showCompletedShows,
        defaultLocation: prefs.defaultLocation,
        favoriteGenres: prefs.favoriteGenres,
        theme: prefs.theme,
      }
    },

    votes: async (parent, { limit = 50, offset = 0 }, { prisma }) => {
      return prisma.vote.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    },

    voteAnalytics: async (parent, { showId }, { prisma }) => {
      const where: any = { userId: parent.id }
      if (showId) where.showId = showId

      return prisma.voteAnalytics.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      return prisma.vote.count({
        where: { userId: parent.id },
      })
    },

    joinedDaysAgo: (parent) => {
      const created = new Date(parent.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    },

    isActive: async (parent, _args, { prisma }) => {
      // Consider a user active if they've voted in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentVotes = await prisma.vote.count({
        where: {
          userId: parent.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      })

      return recentVotes > 0
    },
  },

  UserPreferences: {
    defaultLocation: (parent) => {
      if (!parent.defaultLocation) return null
      
      // Assuming defaultLocation is stored as JSON
      const location = typeof parent.defaultLocation === 'string' 
        ? JSON.parse(parent.defaultLocation)
        : parent.defaultLocation

      return {
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      }
    },
  },
}